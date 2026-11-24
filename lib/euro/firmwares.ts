// Firmwares for the digital Eurorack modules that have a settings page.
// The pages are single file web apps from the hardware repo, built into
// app/firmwares/apps/<id> by scripts/sync-firmware-apps.mjs.

export interface Firmware {
  id: string;
  module: string;
  name: string;
  tagline: string;
  description: string;
  // What the firmware does, in the page HTML for readers and agents
  features: string[];
}

export const FIRMWARES: Firmware[] = [
  {
    id: '32bit-master',
    module: '32bit',
    name: 'Master',
    tagline: 'End-of-chain processor',
    description: 'Turns the 32bit into the last stop of your patch: the kick into IN L, everything else into IN R, and a finished mono mix out of OUT L and OUT R. Set it up from your browser over USB.',
    features: [
      'Kick strip: trim, filter and a look-ahead limiter, in the order you choose.',
      'Mix strip: trim, filter and multiband dynamics that duck the mix under the kick (or under itself).',
      'Parallel bus: sends from the kick and the mix into a heavy compressor, returned under the main.',
      'Master strip: glue compressor, filter and a limiter that never passes its ceiling.',
      'Panel: attach any setting to CV 1, CV 2 or the MODE button, and choose what the LED shows.',
      'Settings are heard at once. Save them to the module, or export and import them as a text file.',
    ],
  },
];

export function getFirmware(id: string) {
  return FIRMWARES.find(firmware => firmware.id === id);
}
