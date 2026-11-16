import type { Metadata } from 'next';
import Link from 'next/link';

const title = '16bit Web UI - Bread Modular Original';
const description = 'Control the Bread Modular Original 16bit module from your browser over USB: sampler, polysynth, monosynth, FX rack and Elab apps. Needs a browser with Web Serial, such as Chrome or Edge on a computer.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/ui/16bit' },
  openGraph: { title, description, type: 'website', url: '/ui/16bit' },
};

export default function Ui16bitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <noscript>
        <p>
          <strong>16bit Web UI for Bread Modular Original.</strong> {description} This app needs JavaScript.
        </p>
        <p>
          <Link href="/docs/16bit">Read the 16bit docs</Link> · <Link href="/original/modules/16bit">See the 16bit module</Link> · <Link href="/original">Bread Modular Original</Link>
        </p>
      </noscript>
      {children}
    </>
  );
}
