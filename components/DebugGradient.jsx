'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DebugGradient() {
  const pathname = usePathname();
  
  useEffect(() => {
    console.log('🔍 === GRADIENT DEBUG FOR:', pathname, '===');
    
    // Check body background
    const bodyStyles = window.getComputedStyle(document.body);
    console.log('1️⃣ Body background:', {
      background: bodyStyles.background,
      backgroundImage: bodyStyles.backgroundImage
    });
    
    // Check for any gradient overlays
    const gradientElements = [
      '.channel__gradient',
      '.clean-about-page__gradient',
      '.menu-overlay',
      '.transition-curtain'
    ];
    
    gradientElements.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        const styles = window.getComputedStyle(el);
        console.log(`2️⃣ ${selector}:`, {
          exists: true,
          background: styles.background,
          opacity: styles.opacity,
          display: styles.display,
          pointerEvents: styles.pointerEvents
        });
      } else {
        console.log(`2️⃣ ${selector}: not found on page`);
      }
    });
    
    // Check for background images with masks
    const bgImages = document.querySelectorAll('[class*="background-image"]');
    bgImages.forEach((el, i) => {
      const styles = window.getComputedStyle(el);
      console.log(`3️⃣ Background image ${i} (${el.className}):`, {
        maskImage: styles.maskImage || styles.webkitMaskImage,
        opacity: styles.opacity,
        filter: styles.filter
      });
    });
    
    // Check scene wrapper
    const sceneWrapper = document.querySelector('.scene-wrapper');
    if (sceneWrapper) {
      const styles = window.getComputedStyle(sceneWrapper);
      console.log('4️⃣ Scene wrapper:', {
        background: styles.background,
        backgroundColor: styles.backgroundColor
      });
    }
    
    console.log('🔍 === END DEBUG ===');
  }, [pathname]);
  
  return null; // This component doesn't render anything
}
