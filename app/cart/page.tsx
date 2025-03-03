'use client';

import { useCart } from '@/lib/cart';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

// Get the current environment
const environment = process.env.APP_ENV === 'production' ? 'production' : 'development';

export default function CartPage() {
  const { items, removeItem, itemCount } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const totalPrice = items.reduce((total, item) => {
    return total + (item.version.price * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if all items have the appropriate productId
      const missingProductIds = items.filter(item => {
        if (environment === 'production') {
          return !item.version.productId;
        } else {
          return !item.version.devProductId && !item.version.productId;
        }
      });
      
      if (missingProductIds.length > 0) {
        throw new Error(`Some items are missing product IDs. Please contact support.`);
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Shopping Cart</h1>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        {itemCount === 0 ? (
          <div className={styles.emptyCart}>
            <p>Your cart is empty.</p>
            <Link href="/modules" className={styles.continueShoppingLink}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.cartItems}>
              {items.map((item) => (
                <div key={`${item.moduleId}-${item.version.name}`} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemTitle}>
                      <Link href={`/modules/${item.moduleId}`}>
                        {item.moduleTitle}
                      </Link>
                    </h3>
                    <p className={styles.itemVersion}>Version: {item.version.name}</p>
                    <p className={styles.itemPrice}>${item.version.price}</p>
                    <p className={styles.itemQuantity}>Quantity: {item.quantity}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <button 
                      className={styles.removeButton}
                      onClick={() => removeItem(item.moduleId, item.version.name)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.cartSummary}>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span className={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping:</span>
                <span>Calculated at checkout</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total:</span>
                <span className={styles.totalPrice}>${totalPrice.toFixed(2)}+</span>
              </div>
              <p className={styles.shippingNote}>Final total including shipping will be calculated at checkout</p>
              <button 
                className={`${styles.checkoutButton} ${isLoading ? styles.loading : ''}`}
                onClick={handleCheckout}
                disabled={isLoading || itemCount === 0}
              >
                {isLoading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              <Link href="/modules" className={styles.continueShoppingLink}>
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}