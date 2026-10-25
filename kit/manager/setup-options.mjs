// Choices already defined by workflow/QUESTIONNAIRE.md §§1, 2, 9.
export const interfaceModes = ['Light', 'Dark'];
export const interfaceDevices = ['Responsive web', 'Desktop web', 'Mobile web', 'iOS', 'Android', 'Tablet', 'Desktop app', 'Other'];
export const tokenizationRules = {auto:'Follow ds-create init',keep:'Keep existing naming',normalize:'Normalize naming'};
export function normalizeInterfaceDetails(value) {
  if(value==null)return null; // Saved sessions and older API clients remain readable.
  if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['modes','devices','tokenization'].includes(k)))throw new Error('Invalid interface details.');
  for(const [key,allowed] of [['modes',interfaceModes],['devices',interfaceDevices]]){
    const values=value[key];
    if(!Array.isArray(values)||!values.length||values.length>allowed.length||new Set(values).size!==values.length||values.some(v=>!allowed.includes(v)))throw new Error(key==='modes'?'Choose Light, Dark, or both.':'Choose at least one supported device or platform.');
  }
  if(!Object.hasOwn(tokenizationRules,value.tokenization))throw new Error('Choose a tokenization rule from ds-create init.');
  return {modes:interfaceModes.filter(v=>value.modes.includes(v)),devices:interfaceDevices.filter(v=>value.devices.includes(v)),tokenization:value.tokenization};
}
export function interfaceDetailsText(value) {
  if(!value)return '';
  return `Modes: ${value.modes.join(', ')}\nDevices / platforms: ${value.devices.join(', ')}\nTokenization rule: ${tokenizationRules[value.tokenization]}`;
}
