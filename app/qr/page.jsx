'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function QrPage() {
  const router = useRouter();
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleIntroEnd = useCallback(() => {
    setIsIntroComplete(true);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('qr-intro-active');
    }
    // Redirect to home after animation completes
    router.push('/');
  }, [router]);

  useEffect(() => {
    // Prefetch the home page for faster navigation
    router.prefetch('/');
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsIntroComplete(true);
      router.push('/');
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

    // Wait for image load before starting animation
    if (imageLoaded) {
      // Small delay to ensure smooth start
      const startTimer = window.setTimeout(() => {
        setShouldAnimate(true);
      }, 100);
      
      return () => {
        window.clearTimeout(startTimer);
        body.classList.remove('qr-intro-active');
      };
    }

    return () => {
      body.classList.remove('qr-intro-active');
    };
  }, [handleIntroEnd, imageLoaded, router]);

  useEffect(() => {
    if (!shouldAnimate || isIntroComplete || typeof window === 'undefined') {
      return;
    }

    const fallbackId = window.setTimeout(() => {
      handleIntroEnd();
    }, 5500);

    return () => {
      window.clearTimeout(fallbackId);
    };
  }, [handleIntroEnd, isIntroComplete, shouldAnimate]);

  return (
    <section className="qr-stage">
      {shouldAnimate && !isIntroComplete ? (
        <div
          className="qr-stage__overlay"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target && event.animationName === 'qrOverlayFade') {
              handleIntroEnd();
            }
          }}
        >
          <div className="qr-stage__image-container">
            <Image
              src="/images/qr.png"
              alt="Scan this QR code to unlock navigation"
              width={408}
              height={408}
              className="qr-stage__image"
              priority
              quality={95}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
