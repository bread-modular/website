'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import styles from './page.module.css';

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  // Clear the cart when the success page loads
  useEffect(() => {
    setTimeout(() => {
      clearCart();
    }, 200);
  }, [clearCart]);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <h1>Thank you for your purchase!</h1>
          <p>Your order has been received and is being processed.</p>
          <p>You should receive a confirmation email shortly.</p>
          <Link href="/modules" className={styles.continueShoppingLink}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </Layout>
  );
} 