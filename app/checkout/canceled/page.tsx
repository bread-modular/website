'use client';

import Layout from '@/app/components/Layout';
import Link from 'next/link';
import styles from './page.module.css';

export default function CheckoutCanceledPage() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.canceledMessage}>
          <h1>Order Canceled</h1>
          <p>Your order has been canceled. No charges were made.</p>
          <p>If you have any questions, please contact our support team.</p>
          <div className={styles.actions}>
            <Link href="/cart" className={styles.primaryButton}>
              Return to Cart
            </Link>
            <Link href="/modules" className={styles.secondaryButton}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 