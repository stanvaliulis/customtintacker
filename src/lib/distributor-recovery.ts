import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import type { PrismaClient, Prisma } from '@prisma/client';
import { hashDistributorPassword } from './distributor-password';

export const RECOVERY_MESSAGE = 'If this email is eligible, a password setup link will be sent. Check your inbox, or try again later.';
export const RECOVERY_ORIGIN = 'https://www.customtintackers.com';
export function distributorRecoveryEnabled() {
  return process.env.TIN_DISTRIBUTOR_ACCOUNTS_ENABLED === '1' && process.env.TIN_DISTRIBUTOR_RECOVERY_ENABLED === '1';
}
export const tokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');
export function validateNewPassword(password: unknown): password is string {
  return typeof password === 'string' && password === password.trim() && Array.from(password).length >= 12 && Buffer.byteLength(password,'utf8') <= 72;
}
type Tx = Prisma.TransactionClient;
type Account = {email:string;status:string;eligible:boolean};

/** Injected DB and mail transport permit isolated rehearsal; this module never logs secrets. */
export function createDistributorRecovery(db: PrismaClient, rateSecret: string) {
  if (rateSecret.length < 32) throw new Error('Recovery rate-limit signing configuration unavailable');
  const key = (value:string) => createHmac('sha256',rateSecret).update(value).digest('hex');
  async function limit(tx:Tx, bucket:string, maximum:number) {
    const windowStart = BigInt(Math.floor(Date.now()/3600000));
    const rows = await tx.$queryRaw<{attempts:number}[]>`INSERT INTO tin_identity.recovery_limit(bucket_key,window_start,attempts)
      VALUES(${key(bucket)},${windowStart},1) ON CONFLICT(bucket_key) DO UPDATE SET
      attempts=CASE WHEN recovery_limit.window_start=EXCLUDED.window_start THEN recovery_limit.attempts+1 ELSE 1 END,
      window_start=EXCLUDED.window_start RETURNING attempts`;
    return rows[0].attempts <= maximum;
  }
  async function account(tx:Tx,email:string) {
    const rows=await tx.$queryRaw<Account[]>`SELECT a.email,a.status,
      (a.application_id IS NULL OR p.status='approved') AS eligible
      FROM tin_identity.distributor_account a LEFT JOIN "DistributorApplication" p ON p.id=a.application_id
      WHERE a.email=${email} FOR UPDATE OF a`;
    return rows[0];
  }
  async function audit(tx:Tx,email:string,event:string) {
    await tx.$executeRaw`INSERT INTO tin_identity.recovery_audit(email,event) VALUES(${email},${event})`;
  }
  return {
    async request(rawEmail:unknown) {
      const email=typeof rawEmail==='string'?rawEmail.trim().toLowerCase():'';
      await db.$transaction(async tx=>{
        // Global cap is independent of identity; no forwarded-IP trust or memory-only limiter.
        if (!await limit(tx,'request-global',200)) return;
        await tx.$executeRaw`DELETE FROM tin_identity.recovery_limit WHERE window_start < ${BigInt(Math.floor(Date.now()/3600000)-48)}`;
        if (!email || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        if (!await limit(tx,'request:'+email,3)) return;
        const a=await account(tx,email);
        if (!a?.eligible || !['approved','setup_required'].includes(a.status)) return;
        const inserted=await tx.$executeRaw`INSERT INTO tin_identity.recovery_job(id,email)
          VALUES(${randomUUID()},${email}) ON CONFLICT DO NOTHING`;
        if(inserted) await audit(tx,email,'requested');
      });
      // Identical result for unknown, disabled, throttled, and eligible identities. Mail is asynchronous.
      return RECOVERY_MESSAGE;
    },
    async complete(token:unknown,password:unknown) {
      if(typeof token!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !validateNewPassword(password)) return false;
      const digest=tokenDigest(token);
      const permitted=await db.$transaction(async tx=>(await limit(tx,'complete-global',200)) && (await limit(tx,'complete:'+digest,10)));
      if(!permitted) return false;
      const passwordHash=await hashDistributorPassword(password);
      return db.$transaction(async tx=>{
        const tokens=await tx.$queryRaw<{email:string}[]>`SELECT email FROM tin_identity.password_token
          WHERE token_hash=${digest} AND consumed_at IS NULL AND expires_at>now()`;
        if(!tokens[0]) return false;
        const a=await account(tx,tokens[0].email);
        if(!a?.eligible || !['approved','setup_required'].includes(a.status)) return false;
        // Recheck after acquiring account lock; issuance and simultaneous consumers share that lock.
        const consumed=await tx.$executeRaw`UPDATE tin_identity.password_token SET consumed_at=now()
          WHERE token_hash=${digest} AND consumed_at IS NULL AND expires_at>now()`;
        if(consumed!==1) return false;
        await tx.$executeRaw`UPDATE tin_identity.distributor_account SET password_hash=${passwordHash},status='approved',
          session_version=session_version+1,updated_at=now() WHERE email=${a.email}`;
        await tx.$executeRaw`UPDATE tin_identity.password_token SET consumed_at=now() WHERE email=${a.email} AND consumed_at IS NULL`;
        await tx.$executeRaw`UPDATE tin_identity.recovery_job SET status='failed',completed_at=now() WHERE email=${a.email} AND status='pending'`;
        await audit(tx,a.email,'password_set');
        return true;
      });
    },
    async deliverOne(send:(email:string,url:string)=>Promise<void>) {
      // No automatic retry after ambiguous mail failure. A fresh request creates a fresh link.
      const token=randomBytes(32).toString('base64url'), digest=tokenDigest(token);
      const job=await db.$transaction(async tx=>{
        // Expired sending leases are terminal. Any link from such a job expires within 30 minutes.
        await tx.$executeRaw`UPDATE tin_identity.recovery_job SET status='failed',completed_at=now()
          WHERE status='sending' AND started_at<now()-interval '35 minutes'`;
        const jobs=await tx.$queryRaw<{id:string;email:string}[]>`SELECT id,email FROM tin_identity.recovery_job
          WHERE status='pending' ORDER BY created_at LIMIT 1`;
        const j=jobs[0];if(!j)return null;
        const a=await account(tx,j.email);
        const claimed=await tx.$executeRaw`UPDATE tin_identity.recovery_job SET status='sending',started_at=now() WHERE id=${j.id} AND status='pending'`;
        if(claimed!==1)return null;
        if(!a?.eligible || !['approved','setup_required'].includes(a.status)) {
          await tx.$executeRaw`UPDATE tin_identity.recovery_job SET status='failed',completed_at=now() WHERE id=${j.id}`;return null;
        }
        // Old links invalidated under the same lock as password completion.
        await tx.$executeRaw`UPDATE tin_identity.password_token SET consumed_at=now() WHERE email=${j.email} AND consumed_at IS NULL`;
        await tx.$executeRaw`INSERT INTO tin_identity.password_token(token_hash,email,expires_at) VALUES(${digest},${j.email},now()+interval '30 minutes')`;
        await audit(tx,j.email,'link_issued');return j;
      });
      if(!job)return false;
      try {
        // Fragment is not sent in HTTP GET requests or Referer headers; scanners cannot consume it.
        await send(job.email,`${RECOVERY_ORIGIN}/wholesale/password/set#token=${token}`);
        await db.$executeRaw`UPDATE tin_identity.recovery_job SET status='sent',completed_at=now() WHERE id=${job.id}`;
      } catch {
        await db.$transaction(async tx=>{
          await tx.$executeRaw`UPDATE tin_identity.password_token SET consumed_at=now() WHERE token_hash=${digest}`;
          await tx.$executeRaw`UPDATE tin_identity.recovery_job SET status='failed',completed_at=now() WHERE id=${job.id}`;
          await audit(tx,job.email,'delivery_failed');
        });
      }
      return true;
    }
  };
}
