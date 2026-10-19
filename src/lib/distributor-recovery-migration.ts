import type {PrismaClient} from '@prisma/client';
import {prepareLegacyDistributorAccounts} from './distributor-migration';
export interface RecoveryApplication {
 id:string;email:string;companyName:string;contactName:string;website:string;
 asiNumber:string;sageNumber:string;ppaiNumber:string;status:string;
}
export interface RecoveryMapping {email:string;primaryId:string;applicationIds:string[];acceptedDifferingFields:string[];}
const fields=['companyName','contactName','website','asiNumber','sageNumber','ppaiNumber'] as const;
const normalize=(s:string)=>s.trim().toLowerCase().replace(/\s+/g,' ');
/** Pure plan preparation, no database access, mail, tokens, or generated customer passwords. */
export async function prepareRecoveryMigration(legacy:Parameters<typeof prepareLegacyDistributorAccounts>[0],applications:RecoveryApplication[],mappings:RecoveryMapping[]) {
 const preserved=await prepareLegacyDistributorAccounts(legacy);
 const accounts: {email:string;passwordHash:string|null;status:string;profile:object;primaryId:string|null;applicationIds:string[]}[]=
   preserved.map(a=>({...a,primaryId:null,applicationIds:[]}));
 const emails=new Set(accounts.map(a=>a.email)),seen=new Set<string>();
 for(const mapping of mappings){
  const email=mapping.email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||emails.has(email)||!mapping.applicationIds.length)throw Error('Duplicate or invalid migration identity');
  const group=mapping.applicationIds.map(id=>applications.find(a=>a.id===id));
  if(group.some(a=>!a||a.status!=='approved'||normalize(a.email)!==email||seen.has(a.id)))throw Error('Application mapping changed or invalid');
  const apps=group as RecoveryApplication[],primary=apps.find(a=>a.id===mapping.primaryId);
  if(!primary)throw Error('Primary application missing');
  for(const field of fields){
   if(new Set(apps.map(a=>normalize(a[field]))).size>1){
    // Shared email is insufficient to merge different companies or contacts.
    if(field==='companyName'||field==='contactName'||!mapping.acceptedDifferingFields.includes(field))throw Error('Business identity requires explicit reconciliation');
   }
  }
  accounts.push({email,passwordHash:null,status:'setup_required',primaryId:primary.id,applicationIds:apps.map(a=>a.id),profile:{
   companyName:primary.companyName,contactName:primary.contactName,asiNumber:primary.asiNumber,sageNumber:primary.sageNumber,ppaiNumber:primary.ppaiNumber,discountTier:0.40,
  }});
  emails.add(email);apps.forEach(a=>seen.add(a.id));
 }
 if(applications.some(a=>a.status==='approved'&&!seen.has(a.id)))throw Error('Approved application omitted');
 return {accounts,applications};
}

/** Explicit one-time caller only. No endpoint invokes this. INSERT-only, all-or-nothing. */
export async function importRecoveryMigration(db:PrismaClient,plan:Awaited<ReturnType<typeof prepareRecoveryMigration>>) {
 return db.$transaction(async tx=>{
  const approved=await tx.$queryRaw<RecoveryApplication[]>`SELECT id,email,"companyName","contactName",website,"asiNumber","sageNumber","ppaiNumber",status
    FROM "DistributorApplication" WHERE status='approved' ORDER BY id FOR UPDATE`;
  const expected=plan.applications.filter(a=>a.status==='approved');
  if(approved.length!==expected.length || approved.some(a=>{const prior=expected.find(p=>p.id===a.id);return !prior||['email','status',...fields].some(k=>a[k as keyof RecoveryApplication]!==prior[k as keyof RecoveryApplication]);}))
    throw Error('Application inventory changed; reconcile again');
  for(const a of plan.accounts){
   await tx.$executeRaw`INSERT INTO tin_identity.distributor_account(email,application_id,password_hash,profile,status)
     VALUES(${a.email},${a.primaryId},${a.passwordHash},${JSON.stringify(a.profile)}::jsonb,${a.status})`;
   for(const id of a.applicationIds)await tx.$executeRaw`INSERT INTO tin_identity.application_link(application_id,email) VALUES(${id},${a.email})`;
  }
  return {accounts:plan.accounts.length,preserved:plan.accounts.filter(a=>a.passwordHash!==null).length,setupRequired:plan.accounts.filter(a=>a.status==='setup_required').length,applicationLinks:plan.accounts.reduce((n,a)=>n+a.applicationIds.length,0)};
 });
}
