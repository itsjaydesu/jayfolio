'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SceneCanvas from '../../components/SceneCanvas';

export default function QrPage() {
  const router = useRouter();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleIntroEnd = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('qr-intro-active');
    }
    // Smooth redirect to home after animation completes
    setTimeout(() => {
      router.push('/');
    }, 300); // Small delay for smooth transition
  }, [router]);

  useEffect(() => {
    // Prefetch the home page for faster navigation
    router.prefetch('/');
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const { body } = document;
    body.classList.add('qr-intro-active');

    // Preload the image for smooth animation
    const img = new window.Image();
    img.onload = () => setImageLoaded(true);
    img.src = '/images/qr.png';

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (motionQuery.matches) {
      handleIntroEnd();
      return () => {
        body.classList.remove('qr-intro-active');
      };
    }

    return () => {
      body.classList.remove('qr-intro-active');
    };
  }, [handleIntroEnd]);

  // Start animation after image loads
  useEffect(() => {
    if (!imageLoaded || typeof window === 'undefined') {
      return;
    }

    // Small delay to ensure smooth start
    const startTimer = setTimeout(() => {
      setShouldAnimate(true);
    }, 100);

    return () => clearTimeout(startTimer);
  }, [imageLoaded]);

  // Redirect after animation completes (5.5s animation duration)
  useEffect(() => {
    if (!shouldAnimate || typeof window === 'undefined') {
      return;
    }

    const redirectTimer = setTimeout(() => {
      handleIntroEnd();
    }, 5500); // Match animation duration

    return () => clearTimeout(redirectTimer);
  }, [shouldAnimate, handleIntroEnd]);

  return (
    <section className="qr-stage">
      {/* Dotfield background scene */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <SceneCanvas activeSection="about" isPaused={false} />
      </div>

      {/* QR Code Animation Overlay */}
      {shouldAnimate && (
        <div className="qr-stage__overlay">
          <div className="qr-stage__image-container">
            <Image
              src="/images/qr.png"
              alt="Scan this QR code to unlock navigation"
              width={408}
              height={408}
              className="qr-stage__image"
              style={{
                animation: 'qrImageBounce 5.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              }}
              priority
              quality={95}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
