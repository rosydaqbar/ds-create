// A concrete first operation for the native worker, derived only from the approved source.
export function requiredFonts(draft){
 return [...new Map((draft.textStyles||[]).map(s=>{
  const font={family:s.fontFamily,style:s.fontStyle??'Regular'};
  if(typeof font.family!=='string'||!font.family||typeof font.style!=='string'||!font.style)throw new Error('Approved text style has no exact font family/style.');
  return [JSON.stringify(font),font];
 })).values()];
}
export function preflightOperation(request,draft){
 const fonts=requiredFonts(draft);
 return {kind:'figma-preflight',readOnly:true,fileKey:new URL(request.figmaUrl).pathname.split('/')[2],sourceHash:request.hash,
  instructions:'Load the applicable Figma tool skill, then execute this read-only code using your existing connected Figma authoring tool on fileKey. Do not regenerate the draft or load generation specs first. Send its actual returned object through action:preflight on the same listener stdin. A tool error must finish blocked with its actual reason. No Figma writes are authorized by this operation. The preflight acknowledgement supplies the next operation or ends the job.',
  code:`const required = ${JSON.stringify(fonts)};
const [available, collections, textStyles, effectStyles] = await Promise.all([figma.listAvailableFontsAsync(), figma.variables.getLocalVariableCollectionsAsync(), figma.getLocalTextStylesAsync(), figma.getLocalEffectStylesAsync()]);
return {fonts: required.map(f => ({...f, available: available.some(a => a.fontName.family === f.family && a.fontName.style === f.style)})), inventory: {collections: collections.length, variables: collections.reduce((n,c) => n + c.variableIds.length, 0), textStyles: textStyles.length, effectStyles: effectStyles.length}};`};
}
export function evaluatePreflight(draft,result){
 const expected=requiredFonts(draft),key=f=>JSON.stringify([f.family,f.style]);
 if(!result||!Array.isArray(result.fonts)||result.fonts.length!==expected.length)throw new Error('Return the actual result for every approved font.');
 const seen=new Map();
 for(const font of result.fonts){
  if(typeof font?.available!=='boolean'||seen.has(key(font))||!expected.some(f=>key(f)===key(font)))throw new Error('Preflight font result differs from the approved font set.');
  seen.set(key(font),font.available);
 }
 if(!result.inventory||!['collections','variables','textStyles','effectStyles'].every(k=>Number.isSafeInteger(result.inventory[k])&&result.inventory[k]>=0))throw new Error('Return the actual read-only file inventory.');
 const missing=expected.filter(f=>!seen.get(key(f)));
 // Font discovery describes this tool's runtime, not permission to publish the draft.
 // Preserve absent faces as advisory evidence; actual writes determine what can be saved.
 return {passed:true,missing,fonts:expected.map(f=>({...f,available:seen.get(key(f))})),inventory:result.inventory};
}
