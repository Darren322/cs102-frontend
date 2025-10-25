import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail } from "lucide-react";
import { stringFormatter } from "@/components/utils/stringFormatter";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";


function authHeaders(): Headers {
  const h = new Headers();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

function resolveUsername(): string {
  const s = sessionStorage.getItem("username");
  if (s) return s;
  const l = localStorage.getItem("username");
  if (l) return l;
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token && token.includes(".")) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.sub || payload?.email || payload?.username || "user@example.com";
    } catch {}
  }
  return "user@example.com";
}

type UserDto = {
  username: string;
  role?: string | null;
  profilePicUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
};

export default function ProfileHeader() {
  const username = resolveUsername();
  const [user, setUser] = useState<UserDto | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(username)}`, {
          method: "GET",
          headers: authHeaders(),
          credentials: "include",
        });
        if (!res.ok) return;
        const data: UserDto = await res.json();
        if (!alive) return;
        setUser(data);
        setProfileUrl(data.profilePicUrl ?? undefined);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [username]);

  // Upload handler
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    try {
      setUploading(true);
      const res = await fetch(
        `${API_URL}/api/users/${encodeURIComponent(username)}/profile-pic`,
        {
          method: "POST",
          headers: authHeaders(), // ✅ do NOT set Content-Type for FormData
          body: fd,
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const newUrl = await res.text(); // backend returns plain URL string
      setProfileUrl(newUrl);
      setUser((u) => (u ? { ...u, profilePicUrl: newUrl } : u));
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Keep design; just swap values
  const displayName = (user?.username ?? username).split("@")[0] || "John Doe";
  const emailText = user?.username ?? "john.doe@example.com";
  // const joined = user?.createdAt
  //   ? new Date(user.createdAt).toLocaleString()
  //   : "March 2023";
  const initials = (emailText?.[0] || "J").toUpperCase();

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={profileUrl}
                alt="Profile"
              />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="outline"
              className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full hover:cursor-pointer hover:scale-105"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload / Take Photo"
              aria-label="Upload / Take Photo"
            >
              <Camera className={uploading ? "animate-pulse" : ""} />
            </Button>
            {/* Hidden input to trigger camera/file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={onPickFile}
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <Badge variant="secondary">{stringFormatter(localStorage['role'])}</Badge>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {emailText}
              </div>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
