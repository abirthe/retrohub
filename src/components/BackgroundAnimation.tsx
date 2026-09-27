import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const BackgroundAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. Strict cross-browser muted attributes for unconditional autoplay clearance
    // Required by iOS Safari, Chrome MEI, Android Chrome, and Firefox
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

    // Synchronous execution within user gesture is mandatory for iOS Safari activation token
    const playVideo = () => {
      if (!video) return;
      try {
        const promise = video.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // Autoplay waiting for interaction on battery-saver or strict policy
          });
        }
      } catch (_) {
        // Fallback for synchronous play exceptions
      }
    };

    // User gesture handler: do NOT defer with requestAnimationFrame or setTimeout
    // Safari requires video.play() to be on the immediate call stack of the gesture event
    const handleUserInteraction = () => {
      if (video && video.paused) {
        playVideo();
      }
    };

    // Lifecycle events: wake up playback when tab is restored or device unlocked
    const handleResume = () => {
      if (document.visibilityState === 'visible' && video && video.paused) {
        playVideo();
      }
    };

    // Loop continuity: guarantee seamless restart even if VOD buffer ends
    const handleEnded = () => {
      if (!video) return;
      video.currentTime = 0;
      playVideo();
    };

    // Network recovery: if mobile cellular drops and comes back
    const handleOnline = () => {
      if (video && video.paused) {
        playVideo();
      }
    };

    // Bind interaction listeners across pointer, touch, scroll, and key
    const interactionEvents: (keyof WindowEventMap)[] = [
      'pointerdown',
      'touchstart',
      'touchend',
      'click',
      'scroll',
      'wheel',
      'keydown',
    ];

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pageshow', handleResume);
    window.addEventListener('focus', handleResume);
    window.addEventListener('online', handleOnline);
    video.addEventListener('ended', handleEnded);

    // 2. Playback Engine Initialization:
    // Engine A: Native HLS (iOS Safari, iPadOS, macOS Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.load();
      video.addEventListener('loadedmetadata', playVideo, { once: true });
      video.addEventListener('canplay', playVideo, { once: true });
      video.addEventListener('loadeddata', playVideo, { once: true });
    } else if (Hls.isSupported()) {
      // Engine B: MSE Hls.js (Chrome, Android Chrome, Edge, Firefox, Samsung Internet)
      hls = new Hls({
        enableWorker: false, // Prevents blob worker restrictions across extensions/sandboxes
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        startLevel: -1, // Auto bitrate for device network
      });

      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isMounted) {
          playVideo();
        }
      });

      // Self-healing recovery for network or media decoding hiccups
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
              try {
                hls?.destroy();
                if (video && isMounted) {
                  hls = new Hls({ enableWorker: false });
                  hls.loadSource(videoSrc);
                  hls.attachMedia(video);
                }
              } catch {
                // Ignore instance reconstruction error
              }
              break;
          }
        }
      });
    }

    // Safety watchdog: periodically ensures video is running
    const watchdog = setInterval(() => {
      if (video && video.paused && document.visibilityState === 'visible') {
        playVideo();
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(watchdog);
      if (hls) {
        hls.destroy();
      }
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('online', handleOnline);
      video.removeEventListener('ended', handleEnded);
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
        className="absolute inset-0 w-full h-full object-cover scale-[1.08] origin-center opacity-75 [filter:hue-rotate(28deg)_saturate(1.35)_brightness(1.08)] [transform:translateZ(0)] will-change-transform transition-opacity duration-1000"
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
