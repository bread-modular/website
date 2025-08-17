export interface Connection {
  from: { module: string; pin: string; index: number };
  to: { module: string; pin: string; index: number };
}

export interface ModuleData {
  name: string;
  inputs: string[];
  outputs: string[];
}

export interface ModuleMetadata {
  inputs?: Array<{ shortname: string; description: string }>;
  outputs?: Array<{ shortname: string; description: string }>;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  width?: number;
  height?: number;
  lines?: string[];
}

export interface KnobSetting { name: string; value: number; description?: string }
export interface StateSetting { name: string; value: string; comment?: string }

export interface PatchUIProps {
  patchData: string;
  moduleMetadataList?: Map<string, ModuleMetadata>;
}

export interface LayoutParams {
  moduleWidth: number;
  moduleSpacing: number;
  rowSpacing: number;
  startX: number;
  startY: number;
  modulesPerRow: number;
}
