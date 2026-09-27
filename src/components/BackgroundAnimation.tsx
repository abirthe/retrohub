import React, { useEffect, useRef } from 'react';

const BackgroundAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // On small mobile screens (< 768px), skip video playback entirely to guarantee 60fps/120fps INP (< 50ms)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) return;

    const video = videoRef.current;
    if (!video) return;

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
      } catch (_) {
        // Silently ignore autoplay restrictions
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const initPlayback = async () => {
      if (isCancelled || !video) return;

      // 1. Native HLS support (Safari/iOS/macOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        video.load();
        video.addEventListener('loadedmetadata', () => {
          playVideo();
        }, { once: true });
        return;
      }

      // 2. Dynamic HLS.js loader for other browsers (Chrome, Edge, Firefox)
      try {
        const hlsModule = await import('hls.js');
        if (isCancelled || !hlsModule) return;
        const Hls = (hlsModule as any).default || hlsModule;

        if (Hls && typeof Hls.isSupported === 'function' && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
          });
          hlsInstance = hls;
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
          const manifestEvent = Hls.Events?.MANIFEST_PARSED || 'hlsManifestParsed';
          hls.on(manifestEvent, () => {
            playVideo();
          });
        }
      } catch (err) {
        console.warn('Hls.js dynamic load error:', err);
      }
    };

    // Defer video playback until the browser is completely idle
    let idleId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
        initPlayback();
      });
    } else {
      timerId = setTimeout(initPlayback, 1200);
    }

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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden bg-background">
      {/* Background Video Animation (desktop only, hardware-accelerated without live CSS filter computation) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="hidden md:block absolute inset-0 w-full h-full object-cover scale-[1.12] origin-center opacity-40 transition-opacity duration-1000"
      />

      {/* Theme Color Harmonization Overlay */}
      <div className="absolute inset-0 bg-primary/10 mix-blend-screen pointer-events-none" />

      {/* Gradients Overlay for Depth and Contrast (Symmetrical & fast) */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-background" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/80" />

      {/* Central Soft Ambient Glow tied to Primary Theme (Hardware-accelerated CSS radial gradient instead of slow SVG blur) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.05) 50%, transparent 70%)',
        }}
      />
    </div>
  );
};

export default BackgroundAnimation;
