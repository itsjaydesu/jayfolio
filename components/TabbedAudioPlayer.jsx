'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function TabbedAudioPlayer({ 
  title, 
  artist, 
  coverImage, 
  mp3Url, 
  losslessUrl,
  className = '' 
}) {
  // MP3 selected by default
  const [activeTab, setActiveTab] = useState('mp3');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [, setIsLoading] = useState(false);
  const [hasSource, setHasSource] = useState(false); // don't attach src until user plays
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const pendingSeekRatioRef = useRef(null);
  
  const currentUrl = activeTab === 'mp3' ? mp3Url : losslessUrl;

  // Attach listeners once
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      // apply any pending seek ratio (e.g., after switching formats)
      if (pendingSeekRatioRef.current != null && isFinite(audio.duration)) {
        const t = Math.max(0, Math.min(audio.duration * pendingSeekRatioRef.current, audio.duration - 0.25));
        try { audio.currentTime = t; } catch { void 0; }
        pendingSeekRatioRef.current = null;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    const audio = audioRef.current;
    wasPlayingRef.current = isPlaying;
    const currentProgress = duration > 0 ? currentTime / duration : 0;
    setActiveTab(tab);
    if (!audio) return;
    
    if (!hasSource) {
      // Nothing loaded yet; just switch selection without starting network
      return;
    }
    // Swap source preserving progress; resume only if it was playing
    try { audio.pause(); } catch { void 0; }
    pendingSeekRatioRef.current = currentProgress;
    setIsLoading(true);
    audio.src = (tab === 'mp3' ? mp3Url : losslessUrl) || '';
    audio.load();
    if (wasPlayingRef.current) {
      audio.play().catch(() => { void 0; });
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!hasSource) {
      // First interaction: attach src and begin playback
      setIsLoading(true);
      audio.src = currentUrl || '';
      setHasSource(true);
      audio.load();
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
      return;
    }
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => { void 0; });
    }
  };

  const handleBackward = () => {
    const audio = audioRef.current;
    if (!audio || !hasSource) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !hasSource) return;

    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`tabbed-audio-player ${className}`}>
      <audio ref={audioRef} preload="none" />
      
      {coverImage?.url && (
        <div className="tabbed-audio-player__artwork">
          <Image
            src={coverImage.url}
            alt={coverImage.alt || `${title} artwork`}
            fill
            className="tabbed-audio-player__artwork-image"
            sizes="(max-width: 640px) 100vw, 640px"
            priority
          />
        </div>
      )}
      
      <div className="tabbed-audio-player__controls">
        <div className="tabbed-audio-player__tabs">
          <button
            className={`tabbed-audio-player__tab ${activeTab === 'mp3' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('mp3')}
            aria-pressed={activeTab === 'mp3'}
          >
            MP3
          </button>
          <button
            className={`tabbed-audio-player__tab ${activeTab === 'lossless' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('lossless')}
            aria-pressed={activeTab === 'lossless'}
          >
            Lossless
          </button>
        </div>
        
        <div className="tabbed-audio-player__info">
          <h3 className="tabbed-audio-player__title">{title}</h3>
          {artist && <p className="tabbed-audio-player__artist">{artist}</p>}
        </div>
        
        <div className="tabbed-audio-player__progress-section">
          <div 
            className="tabbed-audio-player__progress-bar"
            ref={progressRef}
            onClick={handleProgressClick}
            role="slider"
            aria-label="Seek"
            aria-valuemin="0"
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          >
            <div 
              className="tabbed-audio-player__progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="tabbed-audio-player__progress-handle"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
          <div className="tabbed-audio-player__time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="tabbed-audio-player__buttons">
          <button
            className="tabbed-audio-player__backward"
            onClick={handleBackward}
            aria-label="Restart track"
            disabled={!hasSource}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM6.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0013 16V8a1 1 0 00-1.6-.8l-5.334 4z" fill="currentColor"/>
            </svg>
          </button>
          
          <button
            className="tabbed-audio-player__play-pause"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/>
                <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M8 5.14v13.72a1 1 0 001.52.85l11-6.86a1 1 0 000-1.7l-11-6.86A1 1 0 008 5.14z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
