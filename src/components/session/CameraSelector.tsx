// src/pages/during-session/CameraSelector.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X } from "lucide-react";

interface CameraSelectorProps {
  onCameraSelected: (deviceId: string) => void;
  onCancel: () => void;
}

export function CameraSelector({ onCameraSelected, onCancel }: CameraSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDevices();
  }, []);

  const handleStart = () => {
    if (selectedDeviceId) {
      onCameraSelected(selectedDeviceId);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3 pt-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera size={20} />
            Select Camera
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X size={18} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {loading ? (
          <p className="text-gray-400">Loading cameras...</p>
        ) : devices.length === 0 ? (
          <p className="text-red-400">No cameras found. Please check permissions.</p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Available Cameras</label>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger className="w-full bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Select a camera" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device, idx) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleStart} 
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300"
              >
                Start Recognition
              </Button>
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}