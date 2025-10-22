// src/components/api/Recognition.ts

export type Det = { name?: string; confidence?: number };
export type DetsResponse = {
  filter(arg0: (d: any) => any): unknown;
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
  fd.append("image", file, (file as File).name ?? "upload.jpg");
  fd.append("sessionId", sessionId);

  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Scan failed (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as DetsResponse | Det[];
  if (Array.isArray(data)) return { dets: data }; // backward-compatible
  console.log(data);
  return data;
}
