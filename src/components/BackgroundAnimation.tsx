import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const BackgroundAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const videoSrc = 'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8';
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false,
      });
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log('Video play error:', e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.log('Video play error:', e));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden bg-[#070b0a]">
      {/* Background Video Animation */}
      {/* Background Video Animation with Electric Cyan / Neon Teal Color Grading */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 [filter:hue-rotate(35deg)_saturate(1.4)_brightness(1.05)]"
      />

      {/* Electric Cyan Color Harmonization Overlay */}
      <div className="absolute inset-0 bg-cyan-500/10 mix-blend-screen pointer-events-none" />

      {/* Gradients Overlay for Depth and Contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b0a] via-[#070b0a]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b0a] via-transparent to-transparent" />

      {/* Central Soft Ambient Glow in Electric Cyan */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[300px] pointer-events-none">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="30" />
            </filter>
            <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.45)" />
              <stop offset="60%" stopColor="rgba(14, 165, 233, 0.18)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
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
