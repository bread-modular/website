'use client';

import { useEffect } from 'react';

export default function ScrollManager() {
  useEffect(() => {
    const activeLink = document.querySelector('[data-active="true"]');
    if (activeLink) {
      activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  return null;
} 