import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart - Bread Modular',
  description: 'Your Bread Modular shopping cart.',
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
