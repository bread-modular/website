'use client';

import { useState, FormEvent, useEffect } from 'react';
import styles from './NewsletterSignup.module.css';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Add a small delay for a nicer entrance animation
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setStatus('loading');
      setMessage('');
      
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok && !data.message) {
        throw new Error(data.error || 'Failed to subscribe. Please try again.');
      }
      
      setStatus('success');
      setMessage(data.message || 'Successfully subscribed to the newsletter!');
      setEmail(''); // Clear the input on success
      
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const sectionClasses = `${styles.newsletterSection} ${visible ? styles.visible : ''}`;

  return (
    <section className={sectionClasses}>
      <h2 className={styles.newsletterTitle}>STAY IN THE LOOP</h2>
      <p className={styles.newsletterDescription}>
        Subscribe to our newsletter for exclusive updates on new modules, tips, and community events.
      </p>
      
      <form onSubmit={handleSubmit} className={styles.newsletterForm}>
        <div className={styles.inputWrapper}>
          <input
            type="email"
            name="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.emailInput}
            aria-label="Email address for newsletter subscription"
            disabled={status === 'loading'}
          />
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={status === 'loading'}
            aria-label="Subscribe to newsletter"
          >
            {status === 'loading' ? (
              <span className={styles.loadingText}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                SUBSCRIBING
              </span>
            ) : (
              <span>SUBSCRIBE</span>
            )}
          </button>
        </div>
        
        {status === 'success' && (
          <p className={styles.successMessage} role="alert">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '6px', verticalAlign: 'middle' }}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {message}
          </p>
        )}
        
        {status === 'error' && (
          <p className={styles.errorMessage} role="alert">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '6px', verticalAlign: 'middle' }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {message}
          </p>
        )}
        
        <p className={styles.privacyNote}>
          We respect your privacy. No spam, ever. Unsubscribe anytime.
        </p>
      </form>
    </section>
  );
} 