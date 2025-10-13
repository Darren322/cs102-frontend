import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getToken } from "@/components/utils/auth";

type Shot = { file: File; previewUrl?: string; dir: string; ts: number };

export default function HandleTrainingUpload({
  shots,
  endpoint = "http://localhost:8081/api/student/me/training-images",
  onSuccess,
  className,
}: {
  shots: Shot[];
  endpoint?: string;
  onSuccess?: () => void;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!shots.length || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();

      shots.forEach((s, i) => {
        const name = `shot_${String(i).padStart(2, "0")}_${s.dir}.jpg`;
        form.append("files", new File([s.file], name, { type: s.file.type || "image/jpeg" }));
        form.append("directions", s.dir);
      });

      const token = getToken?.();
      const resp = await fetch(endpoint!, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`${resp.status} ${resp.statusText}${text ? ` - ${text}` : ""}`);
      }

      onSuccess?.();
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <Button onClick={handleUpload} disabled={!shots.length || uploading}>
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          "Click here to upload"
        )}
      </Button>
      {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
    </div>
  );
}
