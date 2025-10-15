export type DirectionCore = "STRAIGHT"|"LEFT"|"RIGHT"|"UP"|"DOWN";
export type PoseCenter = { yaw:number; pitch:number };
export type PoseCenters = Record<DirectionCore, PoseCenter>;
export type Boundaries = {
  yaw: { left_vs_straight:number; straight_vs_right:number };
  pitch: { up_vs_straight:number; straight_vs_down:number };
};

const median = (a:number[]) => { const s=[...a].sort((x,y)=>x-y); const n=s.length; return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2; };
export function robustCenter(samples:{yaw:number;pitch:number}[]):PoseCenter{
  return { yaw: median(samples.map(s=>s.yaw)), pitch: median(samples.map(s=>s.pitch)) };
}

export function computeBoundaries(c: PoseCenters): Boundaries {
  return {
    yaw: {
      left_vs_straight: (c.LEFT.yaw + c.STRAIGHT.yaw) / 2,
      straight_vs_right: (c.STRAIGHT.yaw + c.RIGHT.yaw) / 2,
    },
    pitch: {
      up_vs_straight: (c.UP.pitch + c.STRAIGHT.pitch) / 2,
      straight_vs_down: (c.STRAIGHT.pitch + c.DOWN.pitch) / 2,
    },
  };
}
