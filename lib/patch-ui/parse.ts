import { Connection, ModuleData, KnobSetting, StateSetting } from './types';

export function sanitizePatchRaw(raw: string): string {
  let s = raw
    .replace(/\r\n?/g, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<(p|div)(\s+[^>]*)?>/gi, '')
    .replace(/<br\s*\/?>(?=.)/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");
  s = s.split('\n').map(l => l.trimEnd()).join('\n');
  return s.trim();
}

export function parsePatchData(patchData: string): { modules: Map<string, ModuleData>; connections: Connection[]; knobSettings: Map<string, KnobSetting[]>; stateSettings: Map<string, StateSetting[]> } {
  const lines = patchData.split('\n').map(l => l.trim()).filter(l => l.length);
  const modules = new Map<string, ModuleData>();
  const connections: Connection[] = [];
  const knobSettings = new Map<string, KnobSetting[]>();
  const stateSettings = new Map<string, StateSetting[]>();
  let inKnobSection = false;
  let inStateSection = false;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.toLowerCase().startsWith('---knobs')) { inKnobSection = true; inStateSection = false; continue; }
    if (line.toLowerCase().startsWith('---states')) { inStateSection = true; inKnobSection = false; continue; }

    if (inKnobSection) {
      if (!line.includes(':') || !line.includes('@')) continue;
      const [modPart, restAll] = line.split(/:(.+)/);
      if (!restAll) continue;
      const moduleName = modPart.trim();
      const atIdx = restAll.indexOf('@');
      if (atIdx === -1) continue;
      const knobName = restAll.slice(0, atIdx).trim();
      const afterAt = restAll.slice(atIdx + 1).trim();
      const spaceIdx = afterAt.indexOf(' ');
      const valueStr = spaceIdx === -1 ? afterAt : afterAt.slice(0, spaceIdx);
      const description = spaceIdx === -1 ? '' : afterAt.slice(spaceIdx + 1).trim();
      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;
      if (!knobSettings.has(moduleName)) knobSettings.set(moduleName, []);
      knobSettings.get(moduleName)!.push({ name: knobName, value: Math.min(Math.max(value, 0), 1), description: description || undefined });
      if (!modules.has(moduleName)) modules.set(moduleName, { name: moduleName, inputs: [], outputs: [] });
      continue;
    }

    if (inStateSection) {
      if (!line.includes(':') || !line.includes('=')) continue;
      const [left, rightAll] = line.split(/=(.+)/);
      if (!rightAll) continue;
      const leftTrim = left.trim();
      const colonIdx = leftTrim.indexOf(':');
      if (colonIdx === -1) continue;
      const moduleName = leftTrim.slice(0, colonIdx).trim();
      const stateName = leftTrim.slice(colonIdx + 1).trim();
      let valuePart = rightAll.trim();
      let comment: string | undefined;
      const semicolonIdx = valuePart.indexOf(';');
      if (semicolonIdx !== -1) {
        comment = valuePart.slice(semicolonIdx + 1).trim();
        valuePart = valuePart.slice(0, semicolonIdx).trim();
      }
      if (!moduleName || !stateName || !valuePart) continue;
      if (!stateSettings.has(moduleName)) stateSettings.set(moduleName, []);
      stateSettings.get(moduleName)!.push({ name: stateName, value: valuePart, comment });
      if (!modules.has(moduleName)) modules.set(moduleName, { name: moduleName, inputs: [], outputs: [] });
      continue;
    }

    if (line.includes('->')) {
      line = line.replace(/<[^>]+>/g, '');
      const [fromRaw, toRaw] = line.split('->').map(s => s.trim());
      if (!fromRaw || !toRaw) continue;
      const [fromModule, fromPin = ''] = fromRaw.split(':');
      const [toModule, toPin = ''] = toRaw.split(':');
      if (!fromModule || !toModule) continue;
      const isOpenEndedSource = (fromModule === '_' && fromPin === '_') || (fromModule.toLowerCase() === 'none' && fromPin.toLowerCase() === 'none');
      const isOpenEndedDest = (toModule === '_' && toPin === '_') || (toModule.toLowerCase() === 'none' && toPin.toLowerCase() === 'none');
      if (!isOpenEndedSource && !modules.has(fromModule)) modules.set(fromModule, { name: fromModule, inputs: [], outputs: [] });
      if (!isOpenEndedDest && !modules.has(toModule)) modules.set(toModule, { name: toModule, inputs: [], outputs: [] });
      let fromIndex = -1;
      let toIndex = -1;
      if (!isOpenEndedSource && fromPin) {
        const fromModuleData = modules.get(fromModule)!;
        fromModuleData.outputs.push(fromPin);
        fromIndex = fromModuleData.outputs.length - 1;
      }
      if (!isOpenEndedDest && toPin) {
        const toModuleData = modules.get(toModule)!;
        toModuleData.inputs.push(toPin);
        toIndex = toModuleData.inputs.length - 1;
      }
      connections.push({ from: { module: fromModule, pin: fromPin, index: fromIndex }, to: { module: toModule, pin: toPin, index: toIndex } });
    }
  }
  return { modules, connections, knobSettings, stateSettings };
}
