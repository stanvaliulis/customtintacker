const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const {distributorApprovalEmail}=require('../src/lib/email-templates.ts');
test('approval email escapes customer details and keeps credentials in valid single-column tables',()=>{
 const data={contactName:'<img src=x onerror=alert(1)>',companyName:'Example & Co <table>',email:'synthetic@example.invalid',tempPassword:'DEMO-ONLY-<>&"'};
 const result=distributorApprovalEmail(data),doc=new JSDOM(result.html).window.document;
 assert.equal(doc.querySelectorAll('img').length,1);assert.equal(doc.querySelector('img').alt,'Custom Tin Tackers');
 assert.ok(doc.body.textContent.includes(data.contactName));assert.ok(doc.body.textContent.includes(data.tempPassword));
 assert.equal(doc.querySelectorAll('[onerror],script').length,0);
 for(const row of doc.querySelectorAll('tr')){assert.ok(['TABLE','TBODY','THEAD','TFOOT'].includes(row.parentElement.tagName));assert.equal(row.children.length,1);assert.equal(row.children[0].tagName,'TD');}
 const cta=[...doc.querySelectorAll('a')].find(a=>a.textContent==='Sign in to your distributor account');assert.equal(cta.href,'https://www.customtintackers.com/wholesale/login');
 assert.ok(!result.text.includes('Net 30'));assert.ok(!result.text.includes('40%'));assert.ok(!result.text.includes('change your password'));
 assert.ok(result.text.includes(data.tempPassword));
});
