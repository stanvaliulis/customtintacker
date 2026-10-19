/** Product/file facts shared by the local review page and its regression checks. */
export const uploadTitle='Upload & Emboss Your Artwork';
export const uploadDescription='Fit finished artwork to your selected tin tacker, review supported SVG emboss suggestions, or prepare a request for a team proof. PNG, JPG and WebP previews are fitted without automatic tracing.';
export const uploadAnswers=[
 {question:'Should I design my own sign or upload finished artwork?',answer:'Choose Design your own to edit templates, text, images and layout. Choose Upload & emboss when you already have artwork and want a guided fit and proof review. The full editor remains optional.'},
 {question:'Which files get automatic emboss suggestions?',answer:'Supported simple SVG files can suggest existing filled shapes and labelled logo paths. PNG, JPG and WebP images receive automatic fitting only; their raised areas need team advice. PDF, AI and unsupported SVG need team preparation. This flow does not trace bitmap silhouettes.'},
 {question:'Will my artwork be cropped or changed?',answer:'Supported previews are centered and scaled proportionally without cropping. The original file bytes are preserved in the review packet. Automatic fitting is available for square, rectangle and circle products; custom shapes need a team-prepared fit.'},
 {question:'Is this an approved production proof?',answer:'No. Green areas show embossing suggestions, not approved tooling. The team must confirm the final cut, holes, artwork quality and embossing feasibility. Approving a direction in this local review does not submit an order or send a team request.'},
 {question:'How do I keep my review and reopen it?',answer:'Download the review packet before leaving or reloading, then reopen its JSON file here. It retains original artwork, product, raised-area selections and notes. Imported artwork is revalidated and direction approval must be confirmed again. There is no automatic saving of edits. After confirming your direction, you can also save and attach a review within the 3.5 MB online request limit to your cart, then reopen it from the cart. No order or team request is sent.'},
];
export function selectUploadProduct(requested:unknown,products:ReadonlyArray<{id:string}>):string|null{
 if(requested!==undefined){if(typeof requested!=='string')return null;return products.some(p=>p.id===requested)?requested:null;}
 return products.find(p=>p.id==='18-inch-square-tacker')?.id||products[0]?.id||null;
}
export const uploadProductHref=(id:string)=>'/upload-proof?product='+encodeURIComponent(id);
