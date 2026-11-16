import type { Metadata } from 'next';

const title = 'Install 32bit Firmware - Bread Modular Original';
const description = 'Install or update the firmware of the Bread Modular Original 32bit module from your browser over USB.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/ui/32bit/install' },
  openGraph: { title, description, type: 'website', url: '/ui/32bit/install' },
};

export default function Install32bitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <noscript>
        <p>
          <strong>Install 32bit Firmware.</strong> {description} It needs JavaScript and a browser with Web Serial, such as Chrome or Edge on a computer.
        </p>
      </noscript>
      {children}
    </>
  );
}
