export async function presign(studentId: string, pose: string, contentType: string) {
  const res = await fetch("/api/enroll/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, pose, contentType }),
  });
  if (!res.ok) throw new Error("presign failed");
  return res.json() as Promise<{ url: string; key: string; headers?: Record<string, string> }>;
}
