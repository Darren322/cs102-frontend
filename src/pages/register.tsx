import { GalleryVerticalEnd } from "lucide-react";
import { RegisterForm } from "@/components/register-form";
import Lottie from "lottie-web";

import { StarsBackground } from "@/components/animate-ui/backgrounds/stars";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

export default function RegisterPage() {


    const lottieRef = useRef<HTMLDivElement | null>(null);

 
  useEffect(() => {
    const anim = Lottie.loadAnimation({
      container: lottieRef.current!,
      renderer: "canvas",
      loop: true,
      autoplay: true,
      path: "https://puniazcdhuhkxycbtwar.supabase.co/storage/v1/object/public/lottie/herologo.json",
      rendererSettings: {
        progressiveLoad: true,
        preserveAspectRatio: "xMidYMid meet",
      },
    });
    anim.setSpeed(0.8);
    return () => anim.destroy();
  }, []);

    return (
        <div className="grid min-h-svh lg:grid-cols-2 bg-slate-950 text-slate-200">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium text-slate-100">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Smart Attendance
                    </a>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    {/* was: max-w-xs */}
                    <div className="w-full max-w-[420px] md:max-w-[520px]">
                        <RegisterForm />
                    </div>
                </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center bg-slate-900 min-h-[300px] overflow-hidden" >
                <StarsBackground
                    className={cn(
                        'absolute inset-0 items-center justify-center hidden md:block'
                    )}
                    starColor="rgba(255,255,255,0.8)"
                />

                 <div ref={lottieRef} className="relative z-10 w-[320px] h-[320px]" />
            </div>
        </div>
    );
}
