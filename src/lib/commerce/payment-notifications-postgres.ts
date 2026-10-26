import {randomUUID} from 'node:crypto';
import type {PrismaTransactions} from '../persistence/postgres';
import type {NotificationStore,NotificationJob,DeliveryBinding} from './notifications';
import type {Order} from './service';
/** Separate queue: cannot update or release the fulfillment outbox. */
export function paidNotificationStore(client:PrismaTransactions):NotificationStore {
 const transaction=<T>(work:Parameters<PrismaTransactions['$transaction']>[0])=>client.$transaction(work,{isolationLevel:'Serializable',maxWait:5000,timeout:15000}) as Promise<T>;
 async function update(job:NotificationJob,sql:string,...values:unknown[]){
  return transaction(async tx=>{
   const n=await tx.$executeRawUnsafe(sql,job.key,job.leaseToken,...values);
   if(n!==1)throw Error('Notification lease lost');
  });
 }
 return {
  claim:(_now,leaseMs)=>transaction<NotificationJob|null>(async tx=>{
   if(!Number.isFinite(leaseMs)||leaseMs<1000||leaseMs>60000)throw Error('Invalid lease');
   const token=randomUUID();
   const rows=await tx.$queryRawUnsafe<Array<{job_key:string;order_id:string;attempts:number;binding:DeliveryBinding|null}>>("WITH c AS (SELECT job_key FROM tin_payments.notification_outbox WHERE (state='pending' AND next_attempt_at<=clock_timestamp()) OR (state='sending' AND lease_until<=clock_timestamp()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE tin_payments.notification_outbox n SET state='sending',lease_token=$1,lease_until=clock_timestamp()+($2 * interval '1 millisecond'),attempts=n.attempts+1 FROM c WHERE n.job_key=c.job_key RETURNING n.job_key,n.order_id,n.attempts,n.binding",token,leaseMs);
   const row=rows[0];if(!row)return null;
   const orders=await tx.$queryRawUnsafe<Array<{snapshot:Order;paid:boolean;session_id:string|null}>>('SELECT snapshot,paid,session_id FROM tin_payments.payment_order WHERE id=$1',row.order_id);
   if(!orders[0])throw Error('Notification order missing');
   return {id:row.order_id,key:row.job_key,leaseToken:token,attempts:row.attempts,order:{...orders[0].snapshot,paid:orders[0].paid,...(orders[0].session_id?{sessionId:orders[0].session_id}:{})},...(row.binding?{binding:row.binding}:{})};
  }),
  bind:(job,binding)=>transaction<DeliveryBinding>(async tx=>{
   const rows=await tx.$queryRawUnsafe<Array<{binding:DeliveryBinding}>>("UPDATE tin_payments.notification_outbox SET binding=COALESCE(binding,$3::jsonb) WHERE job_key=$1 AND lease_token=$2 AND state='sending' AND lease_until>clock_timestamp() RETURNING binding",job.key,job.leaseToken,JSON.stringify(binding));
   if(!rows[0])throw Error('Notification lease lost');return rows[0].binding;
  }),
  complete:async(job,receipt)=>{
   if(!receipt||receipt.length>200||/[\r\n]/.test(receipt))throw Error('Provider receipt required');
   await update(job,"UPDATE tin_payments.notification_outbox SET state='delivered',provider_receipt=$3 WHERE job_key=$1 AND lease_token=$2 AND state='sending' AND lease_until>clock_timestamp()",receipt);
  },
  retry:async(job,next,code)=>{await update(job,"UPDATE tin_payments.notification_outbox SET state='pending',next_attempt_at=to_timestamp($3/1000.0),last_code=$4 WHERE job_key=$1 AND lease_token=$2 AND state='sending' AND lease_until>clock_timestamp()",next,code);},
  hold:async(job,code)=>{await update(job,"UPDATE tin_payments.notification_outbox SET state='held',last_code=$3 WHERE job_key=$1 AND lease_token=$2 AND state='sending' AND lease_until>clock_timestamp()",code);},
 };
}
