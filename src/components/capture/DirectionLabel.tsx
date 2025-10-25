import type { Direction } from "@/lib/direction";


const LABEL: Record<Direction, string> = {
    NO_FACE: "Show your face",
    STRAIGHT: "Look straight",
    UP: "Look up",
    DOWN: "Look down",
    LEFT: "Turn left",
    RIGHT: "Turn right",
    "UP-LEFT": "Turn up-left",
    "UP-RIGHT": "Turn up-right",
    "DOWN-LEFT": "Turn down-left",
    "DOWN-RIGHT": "Turn down-right",
};


export function DirectionLabel({ dir }: { dir: Direction }) {
    return (
        <div className="mt-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur">
            {LABEL[dir]}
        </div>
    );
}