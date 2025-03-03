'use client';

import { useCart } from '@/lib/cart';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import styles from './page.module.css';

export default function CartPage() {
  const { items, removeItem, itemCount } = useCart();
  
  const totalPrice = items.reduce((total, item) => {
    return total + (item.version.price * item.quantity);
  }, 0);

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Shopping Cart</h1>
        
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
                <span>Total:</span>
                <span className={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
              </div>
              <button className={styles.checkoutButton}>
                Proceed to Checkout
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