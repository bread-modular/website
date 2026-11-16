import type { Metadata } from 'next';
import Link from 'next/link';

const title = '32bit Web UI - Bread Modular Original';
const description = 'Control the Bread Modular Original 32bit module from your browser over USB and edit its FX rack. Needs a browser with Web Serial, such as Chrome or Edge on a computer.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/ui/32bit' },
  openGraph: { title, description, type: 'website', url: '/ui/32bit' },
};

export default function Ui32bitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <noscript>
        <p>
          <strong>32bit Web UI for Bread Modular Original.</strong> {description} This app needs JavaScript.
        </p>
        <p>
          <Link href="/docs/32bit">Read the 32bit docs</Link> · <Link href="/original/modules/32bit">See the 32bit module</Link> · <Link href="/ui/32bit/install">Install the 32bit firmware</Link> · <Link href="/original">Bread Modular Original</Link>
        </p>
      </noscript>
      {children}
    </>
  );
}
