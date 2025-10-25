import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { addNewStudent, getMyStudent } from "@/components/api/backend-methods/Student";
import type { StudentPayload } from "@/components/api/backend-methods/Student";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

type Role = "student" | "staff";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("staff");
  const [showPassword, setShowPassword] = React.useState(false);
  // const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [pendingEnrollMsg, setPendingEnrollMsg] = React.useState<string | null>(null);
  const [pendingEnrollIsError, setPendingEnrollIsError] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // enable if your backend sets cookies
        body: JSON.stringify({ email, password, role }),
      });

  const data = await res.json().catch(() => ({} as unknown as { success?: boolean; token?: string; message?: string; username?: string; role?: string }));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.message || "Invalid email or password");
        return;
      }

      const storage = localStorage
      if (data.token) {
        storage.setItem("token", data.token);
        // Clear any stale studentId from previous sessions — we'll fetch the correct one below
  try { sessionStorage.removeItem("studentId") } catch { /* ignore */ }
        // If there's a pending student payload (from registration), try to enroll now
        try {
          const pendingJson = sessionStorage.getItem("pendingStudent");
          if (pendingJson) {
            const pending = JSON.parse(pendingJson) as StudentPayload;
            // debug: safely decode the JWT and log subject/email for server lookup debugging
            try {
              const parts = data.token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('DEBUG: post-login token subject/email', { sub: payload?.sub, email: payload?.email || payload?.email_address || payload?.preferred_username });
              } else {
                console.warn('DEBUG: unexpected token format when decoding subject');
              }
            } catch (e) {
              console.warn('DEBUG: failed to decode token for logging', e);
            }
            // call addNewStudent with token
            try {
              const studentRes = await addNewStudent(pending, data.token);
              if (studentRes.status >= 200 && studentRes.status < 300) {
                // success -> clear pending and persist studentId
                sessionStorage.removeItem("pendingStudent");
                if (pending.studentId) sessionStorage.setItem("studentId", pending.studentId);
                setPendingEnrollIsError(false);
                setPendingEnrollMsg("Student record created successfully.");
              } else {
                console.warn("Post-login student enroll returned non-2xx", studentRes.status, studentRes.data);
                setPendingEnrollIsError(true);
                setPendingEnrollMsg(studentRes?.data?.message || `Student enroll failed (${studentRes.status})`);
              }
            } catch (err) {
              console.warn("Failed to enroll pending student after login", err);
              setPendingEnrollIsError(true);
              setPendingEnrollMsg("Failed to create Student record. You can retry from your profile.");
            }
          }
        } catch (err) {
          console.warn("Error handling pendingStudent", err);
        }
            // After attempting pending enroll, fetch the canonical student record for this user
            try {
              const meResp = await getMyStudent(data.token);
              if (meResp?.data?.studentId) {
                sessionStorage.setItem("studentId", meResp.data.studentId);
                setPendingEnrollIsError(false);
                // optional: show a message only if we didn't already set one
                if (!pendingEnrollMsg) setPendingEnrollMsg("Student record loaded.");
              }
            } catch (e) {
              // if fetch fails it's non-blocking; page will fallback to stored value or show prompt
              console.warn('Could not load /api/student/me after login', e);
            }
      }
      storage.setItem("username", data.username ?? email);
      storage.setItem("role", data.role ?? role);
      console.log(data)
      if(data.role == "STAFF"){
        // small delay to allow pending message to display if any
        navigate("/dashboard");
      }else{
        if(data.role == "STUDENT"){
          // if we set a pending enroll message, show it briefly before redirecting
          if (pendingEnrollMsg) {
            setTimeout(() => navigate("/enrolStudent"), 900);
          } else {
            navigate("/enrolStudent");
          }
        }
      }

      
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Unable to reach server at " + API_URL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6 text-slate-200", className)}
      onSubmit={onSubmit}
      {...props}
    >
      <FieldGroup className="p-12">
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-2xl font-bold text-slate-100">
            Login to your account
          </h1>
          <p className="text-sm text-balance text-slate-400">
            Enter your email and password to continue
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-600/40 bg-red-600/10 px-4 py-3 text-sm text-red-300">
            {errorMsg}
          </div>
        )}
        {pendingEnrollMsg && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${pendingEnrollIsError ? 'border-red-600/40 bg-red-600/10 text-red-300' : 'border-emerald-600/40 bg-emerald-600/10 text-emerald-300'}`}>
            {pendingEnrollMsg}
          </div>
        )}

        {/* Role */}
        <Field>
          <FieldLabel htmlFor="role" className="text-slate-300">
            Login as
          </FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("student")}
              aria-pressed={role === "student"}
              className={cn(
                "rounded-2xl border px-3 py-2 text-sm transition hover:cursor-pointer hover:scale-101",
                role === "student"
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              )}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("staff")}
              aria-pressed={role === "staff"}
              className={cn(
                "rounded-2xl border px-3 py-2 text-sm transition hover:cursor-pointer hover:scale-101",
                role === "staff"
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              )}
            >
              Staff
            </button>
          </div>
        </Field>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email" className="text-slate-300">
            Email
          </FieldLabel>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="pl-9 bg-slate-950 rounded-2xl border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 rounded-2xl"
            />
          </div>
        </Field>

        {/* Password */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password" className="text-slate-300">
              Password
            </FieldLabel>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password here"
              className="pl-9 pr-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>


        {/* Submit */}
        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 hover:cursor-pointer hover:scale-103 rounded-2xl"
          >
            {loading ? "Signing in…" : "Login"}
          </Button>
        </Field>

        {/* Register link */}
        <div className="mt-2 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            to={`/register`}
            className="underline underline-offset-4 hover:text-slate-200"
          >
            Register
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
