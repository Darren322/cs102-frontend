import {
  Loader2,
  CheckCircle2,
  XCircle,
  Camera,
} from "lucide-react";

export const Icons = {
  spinner: Loader2,
  success: CheckCircle2,
  error: XCircle,
  camera: Camera,
};
export type IconName = keyof typeof Icons;