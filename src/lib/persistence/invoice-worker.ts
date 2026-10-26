import 'server-only';
import {timingSafeEqual} from 'node:crypto';
import {prisma} from '../db';
import {postgresAdapters} from './postgres';
import {resendInvoiceTransport} from './resend-invoice';
import {deliverNextInvoice} from '../commerce/invoice';
import {StorageError} from '../artwork-storage/service';
/** Cron credential is separate from the artwork token and never accepted from query parameters. */
export async function runInvoiceWorker(req:Request){
 const secret=process.env.CRON_SECRET,header=req.headers.get('authorization')||'';
 if(!secret||secret.length<32)throw new StorageError('Notification worker is not configured.',503);
 const expected=Buffer.from('Bearer '+secret),actual=Buffer.from(header);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new StorageError('Unauthorized worker request.',401);
 if(process.env.VERCEL_ENV!=='production'||process.env.TIN_ISOLATED_PREVIEW==='1'||process.env.TIN_WORKFLOW_ENABLED!=='1'||process.env.TIN_INVOICE_MAIL_ENABLED!=='1')throw new StorageError('Invoice delivery is not active.',503);
 const rows=await prisma.$queryRawUnsafe<Array<{version:number}>>('SELECT version FROM tin_workflow.schema_version WHERE singleton=true');
 if(rows.length!==1||rows[0].version!==1)throw new StorageError('Invoice schema is not ready.',503);
 const transport=resendInvoiceTransport(process.env.RESEND_API_KEY||'',process.env.RESEND_FROM||'');
 return deliverNextInvoice({store:postgresAdapters(prisma).outbox,transport,now:Date.now});
}
