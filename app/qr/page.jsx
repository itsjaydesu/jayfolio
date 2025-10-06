'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const ANIMATION_VARIANTS = [
  { id: 'spin', name: 'Classic Spin', animation: 'qrImageSpin' },
  { id: 'bounce', name: 'Bounce & Rotate', animation: 'qrImageBounce' },
  { id: '3dflip', name: '3D Flip', animation: 'qrImage3DFlip' },
  { id: 'pulse', name: 'Pulse & Glow', animation: 'qrImagePulse' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', animation: 'qrImageKaleidoscope' },
  { id: 'portal', name: 'Portal Zoom', animation: 'qrImagePortal' },
  { id: 'elastic', name: 'Elastic Wobble', animation: 'qrImageElastic' },
  { id: 'glitch', name: 'Glitch Scan', animation: 'qrImageGlitch' },
  { id: 'fadespin', name: 'Fade & Spin', animation: 'qrImageFadeSpin' },
  { id: 'dna', name: 'DNA Helix', animation: 'qrImageDNA' },
  { id: 'origami', name: 'Origami Fold', animation: 'qrImageOrigami' },
  { id: 'pixel', name: 'Pixel Dissolve', animation: 'qrImagePixel' },
  { id: 'vinyl', name: 'Vinyl Scratch', animation: 'qrImageVinyl' },
  { id: 'ripple', name: 'Liquid Ripple', animation: 'qrImageRipple' },
  { id: 'spiral', name: 'Spiral Vortex', animation: 'qrImageSpiral' },
  { id: 'rubber', name: 'Rubber Band', animation: 'qrImageRubber' },
  { id: 'prism', name: 'Prism Split', animation: 'qrImagePrism' },
];

export default function QrPage() {
  const router = useRouter();
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);

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

  const handleVariantChange = (index) => {
    setSelectedVariant(index);
    // Reset animation to replay with new variant
    replayAnimation();
  };

  const replayAnimation = () => {
    setShouldAnimate(false);
    setIsIntroComplete(false);
    setTimeout(() => {
      setShouldAnimate(true);
    }, 100);
  };

  return (
    <section className="qr-stage">
      {/* Animation Variant Selector */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 'min(95vw, 1100px)',
          padding: '12px 16px',
          borderRadius: '24px',
          background: 'rgba(6, 18, 26, 0.92)',
          border: '1px solid rgba(138, 248, 255, 0.3)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        }}
      >
        {ANIMATION_VARIANTS.map((variant, index) => (
          <button
            key={variant.id}
            onClick={() => handleVariantChange(index)}
            style={{
              padding: '6px 14px',
              fontSize: '0.65rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              borderRadius: '999px',
              border:
                selectedVariant === index
                  ? '1px solid rgba(138, 248, 255, 0.6)'
                  : '1px solid rgba(138, 248, 255, 0.2)',
              background:
                selectedVariant === index
                  ? 'rgba(0, 92, 106, 0.85)'
                  : 'rgba(4, 24, 30, 0.7)',
              color:
                selectedVariant === index
                  ? 'rgba(232, 252, 255, 0.95)'
                  : 'rgba(200, 232, 236, 0.75)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              boxShadow:
                selectedVariant === index
                  ? '0 0 0 1px rgba(138, 248, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)'
                  : 'none',
            }}
            onMouseEnter={(e) => {
              if (selectedVariant !== index) {
                e.currentTarget.style.background = 'rgba(8, 38, 46, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(138, 248, 255, 0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedVariant !== index) {
                e.currentTarget.style.background = 'rgba(4, 24, 30, 0.7)';
                e.currentTarget.style.borderColor = 'rgba(138, 248, 255, 0.2)';
              }
            }}
          >
            {variant.name}
          </button>
        ))}
        
        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '24px',
            alignSelf: 'center',
            background: 'rgba(138, 248, 255, 0.2)',
          }}
        />
        
        {/* Replay Button */}
        <button
          onClick={replayAnimation}
          style={{
            padding: '6px 14px',
            fontSize: '0.65rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            borderRadius: '999px',
            border: '1px solid rgba(255, 212, 166, 0.4)',
            background: 'rgba(100, 60, 20, 0.7)',
            color: 'rgba(255, 232, 200, 0.9)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(120, 70, 24, 0.85)';
            e.currentTarget.style.borderColor = 'rgba(255, 212, 166, 0.6)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(100, 60, 20, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(255, 212, 166, 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ↻ Replay
        </button>
      </div>

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
              style={{
                animation: `${ANIMATION_VARIANTS[selectedVariant].animation} 4.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              }}
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
