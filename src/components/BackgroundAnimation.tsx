import React from 'react';

const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden bg-[#070b0a]">
      {/* Smooth Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b0a] via-[#070b0a]/90 to-[#070b0a]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b0a] via-transparent to-[#070b0a]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(6,182,212,0.08),transparent_60%)]" />

      {/* Central Soft Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[300px] pointer-events-none opacity-50">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="35" />
            </filter>
            <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(94, 210, 156, 0.3)" />
              <stop offset="100%" stopColor="rgba(94, 210, 156, 0)" />
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
