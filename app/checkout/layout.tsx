import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout - Bread Modular',
  description: 'Bread Modular checkout.',
  robots: { index: false, follow: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
