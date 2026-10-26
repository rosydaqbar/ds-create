export const recipes={
 color:{palettes:{brand:{anchors:{50:'#ffffff',500:'#666666',600:'#333333',950:'#000000'},purpose:'Product actions'},neutral:{anchors:{50:'#ffffff',950:'#000000'},purpose:'Text, surfaces and boundaries'}},tones:{danger:'brand'}},
 typography:{families:{ui:'Inter'}},space:{base:4},shape:{},elevation:{treatment:'layered'},motion:{}
};
export function decisions(request,pack){return {format:'ds-create/foundation-decisions@1',inputHash:request.inputHash,inputRevision:request.inputRevision,product:{name:'Fixture product',description:'A synthetic product for testing foundation preparation.',platform:'Web'},systemMode:'new',naming:'normalize',coverage:pack.sources.map(s=>({path:s.path,hash:s.hash,status:'read'})),decisions:[{key:'UI font',value:'Inter',decidedBy:'user',source:request.contextFile}],domains:Object.fromEntries(Object.entries(structuredClone(recipes)).map(([id,recipe])=>[id,{status:'included',recipe}]))};}
