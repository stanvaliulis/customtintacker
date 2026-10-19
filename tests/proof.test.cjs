const { test } = require('node:test');
const assert = require('node:assert/strict');
const { reviewWarnings, conceptMask, proofNotes } = require('../src/lib/design/proof.ts');
const { matchQuoteSize } = require('../src/lib/design/quote-size.ts');
const { ensureProofIds, readProofIntent, writeProofIntent } = require('../src/lib/design/proof-intent.ts');
const { recoverSavedProof } = require('../src/lib/design/saved-proof.ts');
const { createDocument, parseDocument, validateCanvas } = require('../src/lib/design/document.ts');
const { DesignHistory } = require('../src/lib/design/history.ts');
const { Rect, util } = require('fabric');
require('../src/hooks/useDesignCanvas.ts'); // Registers the actual Fabric serialization properties.
test('real Fabric serialization and copies retain intent with distinct stable identities', async () => {
  const original = new Rect({width:100,height:80,fill:'#ff0000'});
  ensureProofIds([original]);
  const id=original.proofId;
  writeProofIntent({},[original],'yes',[id]);
  const restored=(await util.enlivenObjects([original.toObject()]))[0];
  assert.equal(restored.proofId,id); assert.equal(restored.embossRequested,true);
  const copy=await restored.clone();
  ensureProofIds([copy],true);
  assert.notEqual(copy.proofId,id); assert.equal(copy.embossRequested,true);
  ensureProofIds([original,copy]);
  assert.equal(original.proofId,id); assert.equal(original.fill,'#ff0000');
});
test('selection changes, deletion and undo/redo keep the same element identities', () => {
  const canvas={objects:[{type:'Rect',width:100,height:80}]};
  ensureProofIds(canvas.objects);
  const id=canvas.objects[0].proofId;
  const history=new DesignHistory(); history.reset(JSON.stringify(canvas));
  writeProofIntent(canvas,canvas.objects,'yes',[id]); history.push(JSON.stringify(canvas));
  canvas.objects=[]; history.push(JSON.stringify(canvas));
  const undo=JSON.parse(history.peek(-1)); history.move(-1);
  assert.equal(undo.objects[0].proofId,id); assert.equal(undo.objects[0].embossRequested,true);
  assert.equal(readProofIntent(undo).preference,'yes');
  const before=JSON.parse(history.peek(-1)); history.move(-1);
  assert.equal(before.objects[0].embossRequested,undefined);
  assert.equal(JSON.parse(history.peek(1)).objects[0].embossRequested,true);
});
test('legacy editable documents remain valid; malformed or ambiguous intent is rejected', () => {
  const product={id:'synthetic',shape:'square',width:18,height:18};
  const legacy=createDocument(product,{objects:[{type:'Rect',width:20,height:20}]});
  assert.deepEqual(parseDocument(JSON.stringify(legacy),product).canvas,legacy.canvas);
  assert.equal(readProofIntent(legacy.canvas).preference,'unsure');
  assert.throws(()=>validateCanvas({objects:[{type:'Rect',proofId:'same'},{type:'Rect',proofId:'same'}]}),/duplicate/);
  assert.throws(()=>validateCanvas({objects:[{type:'Rect',embossRequested:true}]}),/element ID/);
  assert.throws(()=>validateCanvas({objects:[],proofIntent:{version:2,status:'approved',preference:'yes'}}),/Unsupported/);
});
test('quote intent reconstructs from saved ID without any session storage or mask approval', () => {
  const canvas={objects:[{type:'Rect',width:20,height:20,proofId:'stable-logo',embossRequested:true}],proofIntent:{version:1,status:'unapproved',preference:'yes'}};
  const record={id:'synthetic-record',canvasJson:JSON.stringify(canvas)};
  const result=recoverSavedProof(record,record.id);
  assert.equal(result.preference,'yes'); assert.deepEqual(result.selectedIds,['stable-logo']);
  assert.match(result.notes,/stable-logo/); assert.match(result.notes,/unapproved/);
  assert.throws(()=>recoverSavedProof(record,'different-id'),/did not match/);
  assert.throws(()=>recoverSavedProof({id:'old',canvasJson:'{"objects":[]}'},'old'),/older design/);
});
test('nested copies receive new IDs while keeping requested intent', () => {
  const group={proofId:'group-a',objects:[{proofId:'child-a',embossRequested:true}]};
  ensureProofIds([group],true);
  assert.notEqual(group.proofId,'group-a'); assert.notEqual(group.objects[0].proofId,'child-a');
  assert.equal(group.objects[0].embossRequested,true);
});
test('proof handoff keeps exact dimensions instead of matching 18 as 8', () => {
  assert.equal(matchQuoteSize('18x18','square'),'18x18');
  assert.equal(matchQuoteSize('8" x 8"','square'),'8x8');
  assert.equal(matchQuoteSize('18x8','rectangle'),'custom');
  assert.equal(matchQuoteSize('18.5x18.5','square'),'custom');
  assert.equal(matchQuoteSize('18 inch','circle'),'circle-18');
  assert.equal(matchQuoteSize('22x9','shield'),'custom');
});
test('review detects clipping and low placed resolution without certifying production', () => {
  const warnings = reviewWarnings([{label:'Photo', type:'image', left:-1, top:0, width:100, height:100, ppi:72}],18,18);
  assert.ok(warnings.some(w=>w.includes('beyond')));
  assert.ok(warnings.some(w=>w.includes('72 PPI') && w.includes('below')));
  assert.ok(warnings.some(w=>w.includes('no production bleed')));
  assert.ok(warnings.some(w=>w.includes('mounting holes')));
});
test('unknown resolution and groups require review; high resolution is not an approval', () => {
  const base={left:0,top:0,width:72,height:72};
  const warnings=reviewWarnings([{...base,label:'Unknown',type:'image'}, {...base,label:'Group',type:'group'}, {...base,label:'Original',type:'image',ppi:600}],18,18);
  assert.ok(warnings.some(w=>w.includes('could not be verified')));
  assert.ok(warnings.some(w=>w.includes('grouped artwork')));
  assert.ok(warnings.some(w=>w.includes('quality still needs review')));
});
test('emboss concept includes only selected supported geometry and does not change print data', () => {
  const layers=[{label:'Logo',type:'rect',maskSvg:'<rect width="72" height="72" fill="black"/>'},{label:'Photo',type:'image'},{label:'Other',maskSvg:'<circle r="50"/>'}];
  const before=JSON.stringify(layers);
  const mask=conceptMask(layers,[0,1],18,12);
  assert.match(mask,/width="18in" height="12in" viewBox="0 0 1296 864"/);
  assert.match(mask,/<rect/); assert.doesNotMatch(mask,/<circle/);
  assert.match(mask,/not an approved tooling mask/);
  assert.equal(JSON.stringify(layers),before);
  assert.match(proofNotes(layers,[0],'yes'),/Requested raised elements: Logo/);
  assert.doesNotMatch(proofNotes(layers,[0],'no'),/Logo/);
});
test('empty artwork and no selection produce no fabricated emboss geometry', () => {
  assert.match(reviewWarnings([],18,18)[0],/no artwork/);
  assert.doesNotMatch(conceptMask([],[],18,18),/<path|<rect|<image/);
});
