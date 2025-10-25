// src/components/api/Recognition.ts

export type Det = { name?: string; confidence?: number };
export type DetsResponse = {
  dets: Det[];
  imageJpegBase64?: string; // optional annotated image
};

export async function scanPhoto(args: {
  url?: string;
  file: File | Blob;
  sessionId: string;
}): Promise<DetsResponse> {
  const { url = "http://localhost:8081/api/recognition/scan", file, sessionId } = args;

  const fd = new FormData();
  // if Blob doesn't have a name, fall back to "upload.jpg"
  fd.append("image", file, (file as File).name ?? "upload.jpg");
  fd.append("sessionId", sessionId);

  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Scan failed (${res.status}): ${text || res.statusText}`);
  }

  const raw = (await res.json()) as unknown;

 
  if (Array.isArray(raw)) {
    return { dets: raw };
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as any).dets)) {
    const { dets, imageJpegBase64 } = raw as { dets: Det[]; imageJpegBase64?: string };
    return { dets, imageJpegBase64 };
  }
  throw new Error("Malformed scan response");
}
