import 'server-only';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {prisma} from '@/lib/db';
import {notificationReadinessHandler} from '@/lib/commerce/notification-readiness';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=notificationReadinessHandler({
 authenticate:isAdminAuthenticated,
 env:()=>process.env,
 schema:async()=>{
  const marker=await prisma.$queryRawUnsafe<Array<{marker:string|null}>>("SELECT to_regclass('tin_preview.identity')::text marker");
  if(marker.length!==1||marker[0].marker)return false;
  const rows=await prisma.$queryRawUnsafe<Array<{contract:string;payment_version:number;workflow_version:number}>>("SELECT i.contract,p.version AS payment_version,w.version AS workflow_version FROM tin_payments.launch_identity i CROSS JOIN tin_payments.schema_version p CROSS JOIN tin_workflow.schema_version w WHERE i.id='customtintackers-production' AND w.singleton=true");
  return rows.length===1&&rows[0].contract==='staff-reviewed-manual-v1'&&rows[0].payment_version===1&&rows[0].workflow_version===1;
 },
 // Static aggregate-only SELECT: never retrieve payload, owner, address, order ID, recipient binding, or receipt.
 queues:()=>prisma.$queryRawUnsafe(`
SELECT 'invoice' AS kind,count(*)::text AS total,
 count(*) FILTER (WHERE state='pending')::text AS pending,
 count(*) FILTER (WHERE state='sending')::text AS sending,
 count(*) FILTER (WHERE state='held')::text AS held,
 count(*) FILTER (WHERE state='delivered')::text AS delivered
FROM tin_workflow.outbox
UNION ALL
SELECT 'paid' AS kind,count(*)::text AS total,
 count(*) FILTER (WHERE state='pending')::text AS pending,
 count(*) FILTER (WHERE state='sending')::text AS sending,
 count(*) FILTER (WHERE state='held')::text AS held,
 count(*) FILTER (WHERE state='delivered')::text AS delivered
FROM tin_payments.notification_outbox
`),
});
