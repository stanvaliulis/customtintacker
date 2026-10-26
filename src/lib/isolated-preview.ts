/** Protected provider variables remain encrypted in Vercel; alias only inside the Preview server. */
export function configureIsolatedPreview(values:NodeJS.ProcessEnv){
 if(values.VERCEL_ENV!=='preview'||values.TIN_ISOLATED_PREVIEW!=='1')return;
 const raw=values.TINTEST_POSTGRES_PRISMA_URL||'';
 let host:string;try{host=new URL(raw).hostname;}catch{throw new Error('Isolated Preview database is missing');}
 if(!host.endsWith('.neon.tech')||host.includes('ep-jolly-shape-a4ni83gl'))throw new Error('Production database forbidden in isolated Preview');
 if((values.POSTGRES_PRISMA_URL&&values.POSTGRES_PRISMA_URL!==raw)||values.RESEND_API_KEY||values.SMTP_PASS||values.STRIPE_SECRET_KEY)throw new Error('Inherited production credentials forbidden');
 if(!values.BLOB_READ_WRITE_TOKEN)throw new Error('Dedicated Preview storage required');
 values.POSTGRES_PRISMA_URL=raw;
 values.POSTGRES_URL_NON_POOLING=values.TINTEST_POSTGRES_URL_NON_POOLING||raw;
 values.ARTWORK_BLOB_READ_WRITE_TOKEN=values.BLOB_READ_WRITE_TOKEN;
 const testPayments=values.TIN_PAYMENTS_TEST_ENABLED==='1'&&values.TIN_PAYMENTS_TEST_DATABASE_HOST===host&&values.TIN_STRIPE_TEST_SECRET_KEY?.startsWith('sk_test_')&&values.TIN_STRIPE_ACCOUNT_ID==='acct_1TO24PIpmMqjUaQp'&&values.TIN_TEST_RECEIVER_ENABLED==='1';
 values.TIN_PAYMENTS_TEST_ENABLED=testPayments?'1':'0';values.TIN_INVOICE_MAIL_ENABLED='0';values.TIN_PAID_ORDER_MAIL_ENABLED='0';values.TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED='0';
}
if(typeof window==='undefined')configureIsolatedPreview(process.env);

