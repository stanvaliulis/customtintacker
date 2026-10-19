import { hashDistributorPassword, verifyDistributorPassword } from './distributor-password';
import type { Prisma } from '@prisma/client';
import {randomUUID} from 'node:crypto';

/** New approvals create a locked setup account and queue a link; no password is generated. */
export async function approveDistributorSetup(id:string) {
  const {prisma}=await import('./db');
  return prisma.$transaction(async tx=>{
    const changed=await tx.distributorApplication.updateMany({where:{id,status:'pending'},data:{status:'approved'}});
    if(changed.count!==1)throw Error('Application must be pending');
    const a=await tx.distributorApplication.findUniqueOrThrow({where:{id}}),email=a.email.trim().toLowerCase();
    await tx.$executeRaw`INSERT INTO tin_identity.distributor_account(email,application_id,password_hash,profile,status)
      VALUES(${email},${id},NULL,${JSON.stringify({companyName:a.companyName,contactName:a.contactName,asiNumber:a.asiNumber,sageNumber:a.sageNumber,ppaiNumber:a.ppaiNumber,discountTier:0.40})}::jsonb,'setup_required')`;
    await tx.$executeRaw`INSERT INTO tin_identity.application_link(application_id,email) VALUES(${id},${email})`;
    await tx.$executeRaw`INSERT INTO tin_identity.recovery_job(id,email) VALUES(${randomUUID()},${email})`;
    await tx.$executeRaw`INSERT INTO tin_identity.recovery_audit(email,event) VALUES(${email},'requested')`;
    return a;
  });
}

export function durableDistributorAccountsEnabled(): boolean {
  return process.env.TIN_DISTRIBUTOR_ACCOUNTS_ENABLED === '1';
}

/** No fallback: a database failure must not create a transient account. */
export async function approveDistributorAccount(id: string, password: string) {
  const passwordHash = await hashDistributorPassword(password);
  const { prisma } = await import('./db');
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Conditional update serializes competing approvals and rolls back on account conflict.
    const changed = await tx.distributorApplication.updateMany({
      where: { id, status: 'pending' }, data: { status: 'approved' },
    });
    if (changed.count !== 1) throw new Error('Application must be pending');
    const application = await tx.distributorApplication.findUniqueOrThrow({ where: { id } });
    const email = application.email.trim().toLowerCase();
    // INSERT, never upsert: approving another application cannot replace an existing password.
    await tx.$executeRaw`INSERT INTO tin_identity.distributor_account
      (email, application_id, password_hash, profile)
      VALUES (${email}, ${id}, ${passwordHash}, ${JSON.stringify({
        companyName: application.companyName, contactName: application.contactName,
        asiNumber: application.asiNumber, sageNumber: application.sageNumber,
        ppaiNumber: application.ppaiNumber, discountTier: 0.40,
      })}::jsonb)`;
    return application;
  });
}

interface AccountRow {
  email: string;
  password_hash: string;
  session_version: number;
  profile: { companyName: string; contactName: string; asiNumber?: string; sageNumber?: string; ppaiNumber?: string; discountTier?: number; legacySubject?:string };
}

export async function authenticateDurableDistributor(email: string, password: string) {
  const { prisma } = await import('./db');
  const rows = await prisma.$queryRaw<AccountRow[]>`SELECT a.email, a.password_hash, a.profile, a.session_version
    FROM tin_identity.distributor_account a
    LEFT JOIN "DistributorApplication" p ON p.id = a.application_id
    WHERE a.email = ${email.trim().toLowerCase()} AND a.status = 'approved'
      AND (a.application_id IS NULL OR p.status = 'approved') LIMIT 1`;
  const account = rows[0];
  if (!account || !(await verifyDistributorPassword(password, account.password_hash))) return null;
  return {
    id: account.profile.legacySubject || account.email, email: account.email, role: 'distributor',
    accountVersion: account.session_version,
    name: account.profile.contactName || account.profile.companyName,
    companyName: account.profile.companyName,
    asiNumber: account.profile.asiNumber || '', sageNumber: account.profile.sageNumber || '',
    ppaiNumber: account.profile.ppaiNumber || '', discountTier: account.profile.discountTier ?? 0.40,
  };
}

export async function isDistributorSessionCurrent(email:string,version:unknown) {
  if(!Number.isInteger(version))return false;
  const {prisma}=await import('./db');
  const rows=await prisma.$queryRaw<{session_version:number}[]>`SELECT a.session_version
    FROM tin_identity.distributor_account a LEFT JOIN "DistributorApplication" p ON p.id=a.application_id
    WHERE a.email=${email.trim().toLowerCase()} AND a.status='approved' AND a.password_hash IS NOT NULL
      AND (a.application_id IS NULL OR p.status='approved') LIMIT 1`;
  return rows[0]?.session_version===version;
}
