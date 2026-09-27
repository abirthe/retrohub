import React, { useEffect, useRef } from 'react';

const BackgroundAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force muted and playsInline for strict mobile browsers (iOS Safari)
    video.defaultMuted = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const videoSrc = 'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8';
    let hlsInstance: { destroy: () => void } | null = null;
    let isCancelled = false;

    const playVideo = async () => {
      try {
        if (video.paused) {
          await video.play();
        }
      } catch (e) {
        console.warn('Video play error (often due to low power mode on mobile):', e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const forcePlayOnInteraction = () => {
      requestAnimationFrame(() => {
        if (video && video.paused) {
          video.play().catch(() => {});
        }
      });
    };

    const setupInteractionListeners = () => {
      window.addEventListener('click', forcePlayOnInteraction, { once: true, passive: true });
      window.addEventListener('touchstart', forcePlayOnInteraction, { once: true, passive: true });
      window.addEventListener('scroll', forcePlayOnInteraction, { once: true, passive: true });
      window.addEventListener('keydown', forcePlayOnInteraction, { once: true });
    };

    const initPlayback = async () => {
      if (isCancelled || !video) return;

      // 1. Native HLS support (Safari/iOS) - zero extra JS required!
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        video.load();
        video.addEventListener('loadedmetadata', () => {
          playVideo();
          setupInteractionListeners();
        }, { once: true });
        return;
      }

      // 2. Dynamic HLS.js loader for browsers without native HLS support
      try {
        const { default: Hls } = await import('hls.js');
        if (isCancelled) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
          });
          hlsInstance = hls;
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            playVideo();
            setupInteractionListeners();
          });
        }
      } catch (err) {
        console.warn('Failed to load Hls.js dynamically:', err);
      }
    };

    // Defer HLS setup to idle time so main thread / LCP paint is 100% unimpeded
    let idleId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
        initPlayback();
      });
    } else {
      timerId = setTimeout(initPlayback, 800);
    }

    // Backup interval to attempt playback if blocked
    const forcePlayInterval = setInterval(() => {
      if (video.paused) {
        playVideo();
      } else {
        clearInterval(forcePlayInterval);
      }
    }, 2500);

    return () => {
      isCancelled = true;
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      clearInterval(forcePlayInterval);
      window.removeEventListener('click', forcePlayOnInteraction);
      window.removeEventListener('touchstart', forcePlayOnInteraction);
      window.removeEventListener('scroll', forcePlayOnInteraction);
      window.removeEventListener('keydown', forcePlayOnInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden bg-background">
      {/* Background Video Animation with Electric Cyan / Neon Teal Color Grading */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover scale-[1.15] origin-center opacity-60 [filter:hue-rotate(35deg)_saturate(1.4)_brightness(1.05)]"
      />

      {/* Theme Color Harmonization Overlay */}
      <div className="absolute inset-0 bg-primary/10 mix-blend-screen pointer-events-none" />

      {/* Gradients Overlay for Depth and Contrast (Symmetrical) */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-background" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/80" />

      {/* Central Soft Ambient Glow tied to Primary Theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[300px] pointer-events-none">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          preserveAspectRatio="none"
          overflow="visible"
        >
          <defs>
            <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="30" />
            </filter>
            <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx="400"
            cy="150"
            rx="300"
            ry="100"
            fill="url(#glow-gradient)"
            filter="url(#glow-blur)"
          />
        </svg>
      </div>
    </div>
  );
};

export default BackgroundAnimation;
