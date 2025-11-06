import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CameraCircle } from "@/components/capture/CameraCircle";
import { useDirectionLoop } from "@/hooks/useDirectionLoop";
import type { Direction } from "@/lib/direction";
import RegulaSpokeCrown from "@/components/capture/RegulaRadialGuide";
import Lottie from "lottie-web";
import HandleTrainingUpload from "@/components/api/backend-methods/HandleTrainingUpload";

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

type Shot = { file: File; previewUrl: string; dir: Direction; ts: number };

export default function DirectionCaptureFlow({
  steps = DEFAULT_STEPS,
  holdSeconds = 1,
  size = 420,
}: {
  steps?: Step[];
  holdSeconds?: number;
  size?: number;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const target = steps[Math.min(stepIndex, steps.length - 1)];
  const done = stepIndex >= steps.length;

  // Head-pose loop (disabled once done)
  const { videoRef, dir, stop } = useDirectionLoop(640, 640, !done) as any;

  // Countdown/capture state
  const [countdown, setCountdown] = useState<number>(holdSeconds);
  const startMsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const captureLockRef = useRef(false);
  const [shots, setShots] = useState<Shot[]>([]);

  const onTarget = useMemo(() => dir === target, [dir, target]);

  // Geometry for perfect concentric layout
  const GAP = 12;             // must match the crown's `gap`
  const TICK = 25;            // must match the crown's `tickLength`
  const INNER = size;         // exact video/circle diameter
  const OUTER = size + 2 * (GAP + TICK); // crown needs extra radius for ticks

  // Lottie (success) — load only when done and container exists
  const lottieRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!done || !lottieRef.current) return;

    const anim = Lottie.loadAnimation({
      container: lottieRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "https://puniazcdhuhkxycbtwar.supabase.co/storage/v1/object/public/lottie/RightTick.json",
      rendererSettings: {
        progressiveLoad: true,
        preserveAspectRatio: "xMidYMid meet",
      },
    });

    anim.setSpeed(0.8);

    const onReady = () => {
      anim.playSegments([0, 120], true);
      anim.addEventListener("complete", () => {
        anim.goToAndStop(120, true);
      });
    };

    anim.addEventListener("data_ready", onReady);

    return () => {
      anim.removeEventListener("data_ready", onReady);
      anim.destroy();
    };
  }, [done]);

  // Reset countdown when target changes
  const prevTargetRef = useRef<Step | null>(null);
  useEffect(() => {
    if (prevTargetRef.current !== target) {
      prevTargetRef.current = target;
      startMsRef.current = null;
      setCountdown(holdSeconds);
      captureLockRef.current = false;
    }
  }, [target, holdSeconds]);

  // rAF for countdown & capture — cancels when done
  useEffect(() => {
    if (done) return;

    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const now = performance.now();

      if (!captureLockRef.current && onTarget) {
        if (startMsRef.current == null) startMsRef.current = now;
        const elapsed = (now - startMsRef.current) / 1000;
        const remain = Math.max(0, holdSeconds - elapsed);
        const next = parseFloat(remain.toFixed(1));
        setCountdown((c) => (c !== next ? next : c));

        if (remain <= 0) {
          captureLockRef.current = true;
          void captureFrame().then((res) => {
            if (res) {
              setShots((s) => [
                ...s,
                { file: res.file, previewUrl: res.previewUrl, dir: target, ts: Date.now() },
              ]);
            }
            setStepIndex((i) => i + 1);
            startMsRef.current = null;
            setCountdown(holdSeconds);
            setTimeout(() => {
              captureLockRef.current = false;
            }, 150);
          });
        }
      } else {
        startMsRef.current = null;
        setCountdown((c) => (c !== holdSeconds ? holdSeconds : c));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [onTarget, holdSeconds, done, target, dir]);

  // Stop head-pose loop & camera when done
  useEffect(() => {
    if (!done) return;
    try { stop?.(); } catch {}
    const v = videoRef.current as HTMLVideoElement | null;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.pause();
      v.srcObject = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setCountdown(0);
  }, [done, stop, videoRef]);

  // Capture current frame → return File (for upload) + previewUrl (for gallery)
  const captureFrame = async (): Promise<{ file: File; previewUrl: string } | null> => {
    const vid = videoRef.current as HTMLVideoElement | null;
    if (!vid || vid.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || vid.videoWidth === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(vid, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], `captured_${Date.now()}.jpg`, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      }, "image/jpeg", 0.92);
    });
  };

  const resetFlow = () => {
    shots.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
    setShots([]);
    setStepIndex(0);
    setCountdown(holdSeconds);
    startMsRef.current = null;
    captureLockRef.current = false;
  };

  return (
    <Card className="mx-auto w-full max-w-[900px] border-muted/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <CardContent className="flex flex-col items-center gap-5 p-6">
        {/* Concentric camera + crown */}
        <div className="relative" style={{ width: OUTER, height: OUTER }}>
          {/* INNER anchor: exactly size×size, centered */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{ width: INNER, height: INNER, transform: "translate(-50%, -50%)" }}
          >
            {/* Camera circle (fills inner) */}
            <div className="absolute inset-0 z-0">
              <CameraCircle videoRef={videoRef} size={INNER} />
            </div>

            {/* Countdown veil (inner circle) */}
            {!done && onTarget && !captureLockRef.current && startMsRef.current && (
              <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: INNER, height: INNER, background: "rgba(0,0,0,0.45)" }}
                >
                  <div
                    className="font-semibold text-white"
                    style={{ fontSize: Math.max(48, Math.round(INNER * 0.22)) }}
                  >
                    {Math.ceil(countdown)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Crown anchor: OUTER box (allows ticks), same center */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 grid place-items-center"
            style={{ width: OUTER, height: OUTER, transform: "translate(-50%, -50%)" }}
          >
            <RegulaSpokeCrown
              circleSize={INNER}   // base circle diameter
              hintDirection={done ? "NO_FACE" : target}
              done={done}
              spokes={100}
              hintFraction={0.10}
              gap={GAP}
              tickLength={TICK}
              baseColor="rgba(110,108,109,0.80)"
              glowColor="rgba(16,185,129,0.95)"
            />
          </div>

          {/* Success Lottie (inner circle) */}
          {done && (
            <div
              ref={lottieRef}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 grid place-items-center"
              style={{ width: INNER, height: INNER, transform: "translate(-50%, -50%)" }}
            />
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
          <Button size="sm" variant="outline" onClick={resetFlow}>
            Reset
          </Button>
        </div>

        {/* Gallery */}
        {shots.length > 0 && (
          <div className="mt-2 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {shots.map((s, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-muted/20">
                {!!s.previewUrl && <img src={s.previewUrl} className="h-40 w-full object-cover" alt={`shot-${i}`} />}
                <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                  <span>{s.dir.toLowerCase()}</span>
                  <span>{new Date(s.ts).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload block */}
        {done && (
          <div className="mt-3 flex w-full flex-col items-center gap-3">
            <div className="text-sm text-muted-foreground">All steps captured. Camera stopped.</div>
            <HandleTrainingUpload
              shots={shots}
              endpoint="http://localhost:8081/api/student/me/training-images"
              onSuccess={() => {
                shots.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
                setShots([]);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}