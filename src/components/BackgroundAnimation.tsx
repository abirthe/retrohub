import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const BackgroundAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict mobile and desktop autoplay readiness
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');

    const videoSrc = 'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8';
    let hls: Hls | null = null;
    let isMounted = true;

    const playVideo = () => {
      if (!video) return;
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Autoplay restricted until user interaction
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        playVideo();
      }
    };

    const forcePlayOnInteraction = () => {
      if (video && video.paused) {
        playVideo();
      }
    };

    const setupInteractionListeners = () => {
      window.addEventListener('click', forcePlayOnInteraction, { once: true, passive: true });
      window.addEventListener('touchstart', forcePlayOnInteraction, { once: true, passive: true });
      window.addEventListener('scroll', forcePlayOnInteraction, { once: true, passive: true });
      window.addEventListener('keydown', forcePlayOnInteraction, { once: true, passive: true });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setupInteractionListeners();

    // 1. Native HLS support (Safari, iOS WebKit)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.load();
      video.addEventListener('loadedmetadata', playVideo, { once: true });
      video.addEventListener('canplay', playVideo, { once: true });
    } else if (Hls.isSupported()) {
      // 2. MSE HLS.js for Chromium, Edge, Firefox
      hls = new Hls({
        enableWorker: false, // Prevents blob worker restrictions across browser environments
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isMounted) {
          playVideo();
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              break;
          }
        }
      });
    }

    // Fallback interval to kickstart playback if initially blocked by browser autoplay policy
    const checkInterval = setInterval(() => {
      if (video && video.paused) {
        playVideo();
      } else if (video && !video.paused) {
        clearInterval(checkInterval);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
      if (hls) {
        hls.destroy();
      }
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
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover scale-[1.08] origin-center opacity-75 [filter:hue-rotate(28deg)_saturate(1.35)_brightness(1.08)] transition-opacity duration-1000"
      />

      {/* Theme Color Harmonization Overlay */}
      <div className="absolute inset-0 bg-primary/10 mix-blend-screen pointer-events-none" />

      {/* Soft Vignette Gradients for Legibility without Smothering the Video */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/50 pointer-events-none" />

      {/* Central Soft Ambient Glow tied to Primary Theme */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] max-w-[900px] h-[350px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.22) 0%, hsl(var(--primary) / 0.05) 55%, transparent 75%)',
        }}
      />
    </div>
  );
};

export default BackgroundAnimation;
