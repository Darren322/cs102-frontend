import { useCallback, useEffect, useRef, useState } from "react";
import { createFaceLandmarker, releaseFaceLandmarker } from "@/lib/faceLandmarker";
import {
  classifyDirection,
  getAngles,
  smooth,
  isStraight,
  setStraightCenter,
  type Direction,
} from "@/lib/direction";

export function useDirectionLoop(width = 640, height = 640, enabled = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const raf = useRef<number | null>(null);
  const [dir, setDir] = useState<Direction>("NO_FACE");

  const lastYawRef = useRef(90);
  const lastPitchRef = useRef(90);

  const STRAIGHT_STABLE_FRAMES = 5;
  const straightFramesRef = useRef(0);

  const calibrateStraight = useCallback(() => {
    setStraightCenter(lastYawRef.current, lastPitchRef.current);
  }, []);

  const loop = useCallback((landmarker: any) => {
    const v = videoRef.current;
    // Bail if disabled
    if (!enabled) return;

    // Bail if no usable frame yet
    const hasFrame =
      !!v &&
      v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      v.videoWidth > 0 &&
      v.videoHeight > 0;

    if (!hasFrame) {
      raf.current = requestAnimationFrame(() => loop(landmarker));
      return;
    }

    try {
      const res = landmarker.detectForVideo(v!, performance.now());

      if (!res?.faceLandmarks?.[0]) {
        straightFramesRef.current = 0;
        // avoid no-op state churn
        setDir((prev) => (prev !== "NO_FACE" ? "NO_FACE" as Direction : prev));
      } else {
        const { yaw, pitch, ok } = getAngles(res);
        if (ok) {
          const s = smooth(yaw, pitch);
          lastYawRef.current = s.yaw;
          lastPitchRef.current = s.pitch;

          const raw = classifyDirection(s.yaw, s.pitch);

          if (raw === "STRAIGHT" && isStraight(s.yaw, s.pitch)) {
            straightFramesRef.current += 1;
            if (straightFramesRef.current >= STRAIGHT_STABLE_FRAMES) {
              setDir((prev) => (prev !== "STRAIGHT" ? "STRAIGHT" : prev));
            }
          } else {
            straightFramesRef.current = 0;
            setDir((prev) => (prev !== raw ? raw : prev));
          }
        }
      }
    } catch (e) {
      // One-off console is fine; just don't crash the loop
      // console.warn(e);
    }

    raf.current = requestAnimationFrame(() => loop(landmarker));
  }, [enabled]);

  // expose a stop() so the component can halt the loop before killing tracks
  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return; // don't spin up when disabled

    let cancelled = false;

    (async () => {
      const landmarker = await createFaceLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width, height },
        audio: false,
      });

      const v = videoRef.current;
      if (!v) return;

      v.srcObject = stream;
      v.muted = true;
      v.playsInline = true;

      // Autoplay can fail without user gesture; this is safe
      try { await v.play(); } catch {}

      const start = () => {
        if (!cancelled) loop(landmarker);
      };

      if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) start();
      else v.addEventListener("loadeddata", start, { once: true });
    })();

    return () => {
      // cleanup only when effect ran
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;

      releaseFaceLandmarker();

      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks?.();
      tracks?.forEach((t) => t.stop());
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.srcObject = null;
      }
    };
  }, [width, height, loop, enabled]);

  return { videoRef, dir, calibrateStraight, stop };
}