import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const BackgroundAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. Strict cross-browser muted attributes for unconditional autoplay clearance
    // Required by iOS Safari, Chrome MEI, Android Chrome, and Firefox
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    video.playsInline = true;
    video.controls = false;
    video.removeAttribute("controls");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("x5-playsinline", "true");
    video.setAttribute("x5-video-player-type", "h5");
    video.setAttribute("x5-video-player-fullscreen", "false");
    video.setAttribute("x-webkit-airplay", "deny");
    video.setAttribute("disablepictureinpicture", "true");
    video.setAttribute("disableremoteplayback", "true");

    const videoSrc =
      "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";
    let hls: Hls | null = null;
    let isMounted = true;

    // Synchronous execution within user gesture is mandatory for iOS Safari activation token
    const playVideo = () => {
      if (!video) return;
      try {
        const promise = video.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              if (isMounted) {
                setIsPlaying(true);
              }
            })
            .catch(() => {
              // Autoplay waiting for interaction on battery-saver or strict policy
            });
        }
      } catch {
        // Fallback for synchronous play exceptions
      }
    };

    const handlePlaying = () => {
      if (isMounted) {
        setIsPlaying(true);
      }
    };

    // User gesture handler: handles click, touch, scroll, and mouse movement
    const handleUserInteraction = () => {
      if (video && video.paused) {
        playVideo();
      }
    };

    // Lifecycle events: wake up playback when tab is restored or device unlocked
    const handleResume = () => {
      if (document.visibilityState === "visible" && video && video.paused) {
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

    // Bind interaction listeners across pointer, touch, scroll, mouse, and key
    const interactionEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "touchstart",
      "touchend",
      "click",
      "scroll",
      "wheel",
      "keydown",
      "mousemove",
    ];

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("pageshow", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("online", handleOnline);

    video.addEventListener("ended", handleEnded);
    video.addEventListener("canplay", playVideo);
    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplaythrough", playVideo);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("timeupdate", handlePlaying);

    // 2. Playback Engine Initialization:
    // Engine A (Primary for Desktop Chrome/Edge/Firefox, Android): MSE HLS.js
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false, // Prevents blob worker restrictions across extensions/sandboxes
        lowLatencyMode: false, // VOD asset must not use lowLatencyMode
        backBufferLength: 0,
        maxBufferLength: 30,
        startLevel: -1, // Auto bitrate for device network
        autoStartLoad: true,
      });

      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isMounted) {
          playVideo();
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        if (isMounted && video.paused) {
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
                  hls = new Hls({ enableWorker: false, lowLatencyMode: false });
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
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Engine B (Fallback for iOS Safari & iPadOS where MSE is not supported): Native HLS
      video.src = videoSrc;
      video.load();
      video.addEventListener("loadedmetadata", playVideo, { once: true });
      video.addEventListener("canplay", playVideo, { once: true });
      video.addEventListener("loadeddata", playVideo, { once: true });
    }

    // Safety watchdog: periodically ensures video is running and loops cleanly
    const watchdog = setInterval(() => {
      if (video && document.visibilityState === "visible") {
        if (video.paused || video.ended) {
          if (video.ended) {
            video.currentTime = 0;
          }
          playVideo();
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(watchdog);
      if (hls) {
        hls.destroy();
      }
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("pageshow", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("online", handleOnline);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("canplay", playVideo);
      video.removeEventListener("loadeddata", playVideo);
      video.removeEventListener("canplaythrough", playVideo);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("timeupdate", handlePlaying);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden bg-background">
      {/* Decoupled Poster Backdrop: Rendered as pure CSS/HTML outside the <video> tag so mobile browsers NEVER render native play sign overlays */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center scale-[1.05] origin-center opacity-85 sm:opacity-90 [filter:hue-rotate(25deg)_saturate(1.35)_brightness(1.1)] [transform:translateZ(0)] pointer-events-none transition-opacity duration-1000"
        style={{
          backgroundImage: `url('https://image.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys/thumbnail.webp?time=1')`,
        }}
        aria-hidden="true"
      />

      {/* Background Video Animation without native poster attribute to avoid mobile OS play badges */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover scale-[1.05] origin-center [filter:hue-rotate(25deg)_saturate(1.35)_brightness(1.1)] [transform:translateZ(0)] will-change-transform pointer-events-none transition-opacity duration-1000 ${
          isPlaying ? "opacity-85 sm:opacity-90" : "opacity-0"
        }`}
      />

      {/* Theme Color Harmonization Overlay */}
      <div className="absolute inset-0 bg-primary/10 mix-blend-screen pointer-events-none" />

      {/* Balanced Vignette Gradients for Legibility without Smothering the Video */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />

      {/* Central Soft Ambient Glow tied to Primary Theme */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] max-w-[900px] h-[350px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.22) 0%, hsl(var(--primary) / 0.05) 55%, transparent 75%)",
        }}
      />
    </div>
  );
};

export default BackgroundAnimation;
