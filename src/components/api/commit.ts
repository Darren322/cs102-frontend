export async function commitUploads(studentId: string, keys: string[]) {
  const res = await fetch("/api/enroll/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, keys }),
  });
  if (!res.ok) throw new Error("commit failed");
  return res.json();
}
