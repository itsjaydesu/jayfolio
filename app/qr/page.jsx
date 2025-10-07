'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SceneCanvas from '../../components/SceneCanvas';

export default function QrPage() {
  console.log('[QrPage] 🎯 Component function called at', performance.now().toFixed(2), 'ms');
  const router = useRouter();
  const imageWrapperRef = useRef(null);

  const handleComplete = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('qr-intro-active');
    }
    router.push('/');
  }, [router]);

  useEffect(() => {
    console.log('[QrPage] 🎬 useEffect running at', performance.now().toFixed(2), 'ms');
    if (typeof window === 'undefined') return;

    const { body } = document;
    console.log('[QrPage] 🏷️ Adding qr-intro-active class at', performance.now().toFixed(2), 'ms');
    body.classList.add('qr-intro-active');

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      handleComplete();
      return;
    }

    router.prefetch('/');
    
    const completeTimer = setTimeout(handleComplete, 5000);

    return () => {
      clearTimeout(completeTimer);
      body.classList.remove('qr-intro-active');
    };
  }, [router, handleComplete]);

  useEffect(() => {
    const wrapper = imageWrapperRef.current;
    if (!wrapper) return;

    const handleAnimationStart = () => {
      console.log('[QrPage] ▶️ CSS Animation STARTED at', performance.now().toFixed(2), 'ms');
    };

    const img = wrapper.querySelector('.qr-stage__image');
    if (img) {
      img.addEventListener('animationstart', handleAnimationStart);
      return () => {
        img.removeEventListener('animationstart', handleAnimationStart);
      };
    }
  }, []);

  console.log('[QrPage] 🎨 Rendering JSX at', performance.now().toFixed(2), 'ms');
  return (
    <section className="qr-stage">
      <div className="qr-stage__scene">
        <SceneCanvas activeSection="about" isPaused={false} />
      </div>
      
      <div className="qr-stage__content" ref={imageWrapperRef}>
        <div
          style={{ display: 'contents' }}
        >
          <Image
            src="/images/qr.png"
            alt="Scan this QR code to unlock navigation"
            width={408}
            height={408}
            className="qr-stage__image"
            priority
            quality={95}
            onLoadingComplete={() => {
              console.log('[QrPage] 🖼️ Image loaded at', performance.now().toFixed(2), 'ms');
            }}
            onLoad={() => {
              console.log('[QrPage] 📸 Image onLoad at', performance.now().toFixed(2), 'ms');
            }}
          />
        </div>
      </div>
    </section>
  );
}
