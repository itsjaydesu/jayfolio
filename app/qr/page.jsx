'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import SceneCanvas from '../../components/SceneCanvas';

export default function QrPage() {
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [showSceneContent, setShowSceneContent] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleIntroEnd = useCallback(() => {
    setIsIntroComplete(true);
    setShowSceneContent(true);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('qr-intro-active');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsIntroComplete(true);
      setShowSceneContent(true);
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
  }, [handleIntroEnd, imageLoaded]);

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
    <>
      {showSceneContent ? (
        <SceneCanvas activeSection="about" isPaused={false} />
      ) : null}
      
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

        {showSceneContent ? (
          <div className={`qr-stage__content${isIntroComplete ? ' is-visible' : ''}`}>
            {/* Scene content renders behind via SceneCanvas component */}
          </div>
        ) : null}
      </section>
    </>
  );
}
