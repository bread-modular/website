'use client';

import AppHost from '../AppHost';
import run from './app.js';
import markup from './markup';
import style from './style';

// The 32bit Master settings page. Loaded only when the firmware is opened (FirmwareApp.tsx).
export default function MasterApp({ className }: { className?: string }) {
  return <AppHost style={style} markup={markup} run={run} className={className} />;
}
