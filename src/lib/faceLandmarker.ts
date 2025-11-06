import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";


const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const MODEL_URL =
"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";


let instance: FaceLandmarker | null = null;


export async function createFaceLandmarker() {
if (instance) return instance;
console.log("YES INSTANCE");
const resolver = await FilesetResolver.forVisionTasks(WASM_URL);
instance = await FaceLandmarker.createFromOptions(resolver, {
baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
outputFaceBlendshapes: false,
runningMode: "VIDEO",
numFaces: 1,
});
return instance;
}


export function releaseFaceLandmarker() {
instance?.close();
instance = null;
}