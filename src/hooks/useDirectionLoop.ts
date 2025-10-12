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

export function useDirectionLoop(width = 640, height = 640) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const raf = useRef<number | null>(null);
  const [dir, setDir] = useState<Direction>("NO_FACE");

  // keep last smoothed values for calibration
  const lastYawRef = useRef(90);
  const lastPitchRef = useRef(90);

  // hysteresis for STRAIGHT
  const STRAIGHT_STABLE_FRAMES = 5; // tune: 5–12
  const straightFramesRef = useRef(0);

  // one-tap center calibration (call this while looking straight)
  const calibrateStraight = useCallback(() => {
    setStraightCenter(lastYawRef.current, lastPitchRef.current);
  }, []);

  const loop = useCallback((landmarker: any) => {
    const v = videoRef.current;
    if (!v) return;

    try {
      const res = landmarker.detectForVideo(v, performance.now());
      if (!res?.faceLandmarks?.[0]) {
        straightFramesRef.current = 0;
        setDir("NO_FACE");
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
              setDir("STRAIGHT");
            }
          } else {
            straightFramesRef.current = 0;
            setDir(raw);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    raf.current = requestAnimationFrame(() => loop(landmarker));
  }, []);

  useEffect(() => {
    (async () => {
      const landmarker = await createFaceLandmarker();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width, height },
        audio: false,
      });
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        await v.play();

        const start = () => loop(landmarker);
        if (v.readyState >= 2) start();
        else v.addEventListener("loadedmetadata", start, { once: true });
      }
    })();

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      releaseFaceLandmarker();
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, [width, height, loop]);

  return { videoRef, dir, calibrateStraight };
}
