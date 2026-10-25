// Product scope follows workflow/QUESTIONNAIRE.md §10; detailed devices remain readable for old sessions.
export const interfaceModes = ['Light', 'Dark'];
export const interfacePlatforms = ['Web', 'App'];
export const interfaceDevices = [...interfacePlatforms, 'Responsive web', 'Desktop web', 'Mobile web', 'iOS', 'Android', 'Tablet', 'Desktop app', 'Other'];
export function tokenizationPreview(devices = []) {
  const web = devices.some(value => ['Web', 'Responsive web', 'Desktop web', 'Mobile web'].includes(value));
  const app = devices.some(value => ['App', 'iOS', 'Android', 'Desktop app'].includes(value));
  return { product: web && app ? 'both' : web ? 'web' : app ? 'app' : null,
    web, app, needsContext: devices.some(value => ['Tablet', 'Other'].includes(value)) };
}
export function platformsForDevices(devices = []) {
  const {web, app}=tokenizationPreview(devices);
  return [...(web?['Web']:[]),...(app?['App']:[])];
}
export function devicesForPlatforms(saved = [], selected = []) {
  const previous=platformsForDevices(saved),next=interfacePlatforms.filter(value=>selected.includes(value));
  return previous.length===next.length&&previous.every((value,index)=>value===next[index])?[...saved]:next;
}
// auto is accepted only for compatibility with previously saved intake values; never offered by the UI.
export const tokenizationRules = {auto:'Follow ds-create init',keep:'Keep existing naming',normalize:'Normalize naming'};
export function normalizeInterfaceDetails(value) {
  if(value==null)return null; // Saved sessions and older API clients remain readable.
  if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['modes','devices','tokenization'].includes(k)))throw new Error('Invalid interface details.');
  for(const [key,allowed] of [['modes',interfaceModes],['devices',interfaceDevices]]){
    const values=value[key];
    if(!Array.isArray(values)||!values.length||values.length>allowed.length||new Set(values).size!==values.length||values.some(v=>!allowed.includes(v)))throw new Error(key==='modes'?'Choose Light, Dark, or both.':'Choose Web, App, or both.');
  }
  const hasNaming=Object.hasOwn(value,'tokenization');
  if(hasNaming&&!Object.hasOwn(tokenizationRules,value.tokenization))throw new Error('Invalid existing-system naming choice.');
  return {modes:interfaceModes.filter(v=>value.modes.includes(v)),devices:interfaceDevices.filter(v=>value.devices.includes(v)),...(hasNaming?{tokenization:value.tokenization}:{})};
}
export function interfaceDetailsText(value) {
  if(!value)return '';
  return `Modes: ${value.modes.join(', ')}\nDevices / platforms: ${value.devices.join(', ')}${value.tokenization?'\nExisting-system naming: '+tokenizationRules[value.tokenization]:''}`;
}
