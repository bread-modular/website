// Firmwares for the digital Eurorack modules that have a settings page.
// Most pages are single file web apps from the hardware repo, built into
// app/firmwares/apps/<id> by scripts/sync-firmware-apps.mjs; the Audio Lab is
// written here (app/firmwares/apps/audio-lab).

export interface Firmware {
  id: string;
  module: string;
  name: string;
  // the page title, when "<module> <name>" reads badly
  title?: string;
  // how the page talks to the module: its USB serial port, or as an audio interface
  link: 'serial' | 'audio';
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
    link: 'serial',
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
  {
    id: 'audio-lab',
    module: 'USB Audio',
    name: 'Audio Lab',
    title: 'Audio Lab',
    link: 'audio',
    tagline: 'Scope, generator and analyzer',
    description: 'A two channel oscilloscope, a function generator and a spectrum analyzer in your browser. It works with any audio interface and is made for the USB Audio module: 2 in and 2 out at Eurorack levels (±5 V), DC coupled, so CVs work too.',
    features: [
      'Oscilloscope: IN 1 and IN 2 in volts at the jacks, with a trigger (auto, normal, single), roll mode from 200 ms/div and XY.',
      'Measurements on both inputs: frequency, peak to peak, max, min, mean and RMS.',
      'Function generator on OUT 1 and OUT 2: sine, triangle, saw, square with pulse width, noise, log sweep and DC.',
      'Set amplitude in volts peak to peak and an offset in volts; DC holds a steady voltage, so OUT 1 and OUT 2 make CVs.',
      'Spectrum analyzer in dBV with averaging, peak hold, the strongest tone and its THD.',
      'DC voltmeter for both inputs, for checking CVs and offsets.',
      'Demo mode patches the outputs into the inputs inside the page, so it works without the module.',
    ],
  },
];

export function firmwareTitle(firmware: Firmware) {
  return firmware.title ?? `${firmware.module} ${firmware.name}`;
}

export function getFirmware(id: string) {
  return FIRMWARES.find(firmware => firmware.id === id);
}
