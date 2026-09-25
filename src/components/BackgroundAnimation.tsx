import React from 'react';

const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden bg-[#070b0a] z-0">
      {/* Dynamic Ambient Aurora Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Emerald Aurora */}
        <div className="aurora-blob aurora-1 absolute -top-[15%] left-[20%] w-[650px] h-[550px] rounded-full bg-gradient-to-br from-emerald-500/20 via-primary/15 to-transparent blur-[120px] will-change-transform" />

        {/* Cyan Atmosphere Drift */}
        <div className="aurora-blob aurora-2 absolute top-[20%] -left-[10%] w-[550px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-teal-400/10 to-transparent blur-[130px] will-change-transform" />

        {/* Deep Sapphire/Teal Mid Accent */}
        <div className="aurora-blob aurora-3 absolute top-[45%] -right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-teal-600/12 via-emerald-600/10 to-transparent blur-[140px] will-change-transform" />

        {/* Bottom Ambient Flow */}
        <div className="aurora-blob aurora-4 absolute -bottom-[10%] left-[30%] w-[700px] h-[450px] rounded-full bg-gradient-to-t from-emerald-500/15 via-cyan-500/10 to-transparent blur-[120px] will-change-transform" />
      </div>

      {/* Gentle Floating Atmospheric Motes */}
      <div className="absolute inset-0">
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className="ambient-mote absolute rounded-full bg-emerald-400/30"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${(i * 17) % 100}%`,
              left: `${(i * 23) % 100}%`,
              animationDuration: `${16 + (i * 2.5)}s`,
              animationDelay: `${-(i * 1.8)}s`,
            }}
          />
        ))}
      </div>

      {/* Smooth Dark Vignette for crisp text & card contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b0a]/70 via-transparent to-[#070b0a]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#070b0a_100%)] opacity-80" />

      {/* Central Ambient Hero Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] max-w-[900px] h-[350px] pointer-events-none opacity-40">
        <svg
          viewBox="0 0 900 350"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" />
            </filter>
            <radialGradient id="soft-glow-grad" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="rgba(94, 210, 156, 0.35)" />
              <stop offset="60%" stopColor="rgba(20, 184, 166, 0.15)" />
              <stop offset="100%" stopColor="rgba(7, 11, 10, 0)" />
            </radialGradient>
          </defs>
          <ellipse
            cx="450"
            cy="120"
            rx="380"
            ry="110"
            fill="url(#soft-glow-grad)"
            filter="url(#soft-glow)"
          />
        </svg>
      </div>

      <style>{`
        @keyframes aurora-float-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(45px, 35px, 0) scale(1.08); }
        }
        @keyframes aurora-float-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-40px, -30px, 0) scale(1.06); }
        }
        @keyframes aurora-float-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-35px, 40px, 0) scale(0.96); }
        }
        @keyframes aurora-float-4 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(35px, -25px, 0) scale(1.05); }
        }
        @keyframes mote-drift {
          0% {
            transform: translate3d(0, 0, 0) scale(0.8);
            opacity: 0;
          }
          20% {
            opacity: 0.45;
          }
          80% {
            opacity: 0.45;
          }
          100% {
            transform: translate3d(25px, -90px, 0) scale(1.1);
            opacity: 0;
          }
        }
        .aurora-1 { animation: aurora-float-1 22s ease-in-out infinite; }
        .aurora-2 { animation: aurora-float-2 26s ease-in-out infinite; }
        .aurora-3 { animation: aurora-float-3 30s ease-in-out infinite; }
        .aurora-4 { animation: aurora-float-4 24s ease-in-out infinite; }
        .ambient-mote {
          animation: mote-drift linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BackgroundAnimation;
