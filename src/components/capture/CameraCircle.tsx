import React from "react";


export function CameraCircle({ videoRef, size = 420 }: { videoRef: React.RefObject<HTMLVideoElement>; size?: number }) {
    return (
        <div
            className="relative"
            style={{ width: size, height: size }}
        >
            <video
                ref={videoRef}
                className="h-full w-full -scale-x-100 rounded-full object-cover"
                muted
                playsInline
            />
            {/* simple gray ring */}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-violet-400/70" />
        </div>
    );
}