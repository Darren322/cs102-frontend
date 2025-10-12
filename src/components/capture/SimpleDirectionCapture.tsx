import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CameraCircle } from "@/components/capture/CameraCircle";
import { DirectionLabel } from "@/components/capture/DirectionLabel";
import { useDirectionLoop } from "@/hooks/useDirectionLoop";
import type { Direction } from "@/lib/direction";
import RegulaSpokeCrown from "@/components/capture/RegulaRadialGuide";

type Step = Direction;

const DEFAULT_STEPS: Step[] = [
  "STRAIGHT",
  "UP-LEFT",
  "UP",
  "UP-RIGHT",
  "RIGHT",
  "DOWN-RIGHT",
  "DOWN",
  "DOWN-LEFT",
  "LEFT",
  "STRAIGHT",
];

export default function DirectionCaptureFlow({
  steps = DEFAULT_STEPS,
  holdSeconds = 3,
  size = 420,
}: {
  steps?: Step[];
  holdSeconds?: number;
  size?: number;
}) {
  const { videoRef, dir, calibrateStraight } = useDirectionLoop(640, 640) as any;

  const [stepIndex, setStepIndex] = useState(0);
  const target = steps[Math.min(stepIndex, steps.length - 1)];
  const done = stepIndex >= steps.length;

  // countdown state (3 → 2 → 1 capture)
  const [countdown, setCountdown] = useState<number>(holdSeconds);
  const startMsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const captureLockRef = useRef(false);

  // gallery
  const [shots, setShots] = useState<Array<{ url: string; dir: Direction; ts: number }>>([]);

  // true if current dir matches the target step
  const onTarget = useMemo(() => dir === target, [dir, target]);

  // Reset countdown when target step changes
  const prevTargetRef = useRef<Step | null>(null);
  useEffect(() => {
    if (prevTargetRef.current !== target) {
      prevTargetRef.current = target;
      startMsRef.current = null;
      setCountdown(holdSeconds);
      captureLockRef.current = false;
    }
  }, [target, holdSeconds]);

  // rAF loop for countdown & capture
  useEffect(() => {
    const tick = () => {
      const now = performance.now();

      if (done) {
        startMsRef.current = null;
        setCountdown(0);
      } else if (!captureLockRef.current && onTarget) {
        if (startMsRef.current == null) startMsRef.current = now;
        const elapsed = (now - startMsRef.current) / 1000;
        const remain = Math.max(0, holdSeconds - elapsed);
        setCountdown(parseFloat(remain.toFixed(1)));

        if (remain <= 0) {
          captureLockRef.current = true;
          void captureFrame().then((url) => {
            if (url) setShots((s) => [...s, { url, dir: target, ts: Date.now() }]);
            setStepIndex((i) => i + 1);
            startMsRef.current = null;
            setCountdown(holdSeconds);
            setTimeout(() => { captureLockRef.current = false; }, 150);
          });
        }
      } else {
        startMsRef.current = null;
        setCountdown(holdSeconds);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [onTarget, holdSeconds, done, target]);

  // Stop the camera when done
  useEffect(() => {
    if (!done) return;
    const v = videoRef.current as HTMLVideoElement | null;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      v.pause();
      v.srcObject = null;
    }
  }, [done, videoRef]);

  // capture a frame as blob->URL (non-mirrored)
  const captureFrame = async (): Promise<string | null> => {
    const vid = videoRef.current as HTMLVideoElement | null;
    if (!vid || vid.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(vid, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((b) => { resolve(b ? URL.createObjectURL(b) : null); }, "image/jpeg", 0.92);
    });
  };

  const resetFlow = () => {
    setStepIndex(0);
    setCountdown(holdSeconds);
    startMsRef.current = null;
    captureLockRef.current = false;
    setShots([]);
  };

  // overall progress (not used by the crown now, but you may show it elsewhere)
  const progress = !done && onTarget && startMsRef.current
    ? Math.min(1, (holdSeconds - countdown) / holdSeconds)
    : 0;

  return (
    <Card className="mx-auto w-full max-w-[900px] border-muted/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <CardContent className="flex flex-col items-center gap-5 p-6">
        {/* Camera + crown wrapper so crown sits outside the circle */}
        <div className="relative grid place-items-center" style={{ width: size + 60, height: size + 60 }}>
          {/* Video circle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <CameraCircle videoRef={videoRef} size={size} />
          </div>

          {/* Crown (hints based on TARGET) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <RegulaSpokeCrown
              circleSize={size}
              hintDirection={done ? "NO_FACE" : target} // when done, force gray
              done={done}
              spokes={100}
              hintFraction={0.10} // 1/10 of ring
              gap={12}
              tickLength={20}
              baseColor="rgba(110,108,109,0.80)"
              glowColor="rgba(16,185,129,0.95)"
            />
          </div>

          {/* FULL circular countdown veil when on target */}
          {!done && onTarget && !captureLockRef.current && startMsRef.current && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: size, height: size, background: "rgba(0,0,0,0.45)" }}
              >
                <div className="font-semibold text-white" style={{ fontSize: Math.max(48, Math.round(size * 0.22)) }}>
                  {Math.ceil(countdown)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Step {Math.min(stepIndex + 1, steps.length)} / {steps.length}
          </Badge>
          <Badge className={onTarget ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
            {done ? "Completed" : onTarget ? `Hold ${target.toLowerCase()}…` : `Please look ${target.toLowerCase()}`}
          </Badge>
          <DirectionLabel dir={dir as Direction} />
          <Button size="sm" variant="outline" onClick={resetFlow}>Reset</Button>
          {typeof calibrateStraight === "function" && (
            <Button size="sm" variant="outline" onClick={calibrateStraight}>Calibrate center</Button>
          )}
        </div>

        {/* Steps preview */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          {steps.map((s, i) => (
            <div key={i}
              className={`rounded-full border px-2 py-0.5 ${
                i < stepIndex ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : i === stepIndex ? "bg-violet-50 border-violet-300 text-violet-700" : ""}`}>
              {s.toLowerCase()}
            </div>
          ))}
        </div>

        {/* Gallery */}
        {shots.length > 0 && (
          <div className="mt-2 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {shots.map((s, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-muted/20">
                <img src={s.url} className="h-40 w-full object-cover" alt={`shot-${i}`} />
                <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                  <span>{s.dir.toLowerCase()}</span>
                  <span>{new Date(s.ts).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {done && <div className="mt-2 text-sm text-muted-foreground">All steps captured. Camera stopped.</div>}
      </CardContent>
    </Card>
  );
}
