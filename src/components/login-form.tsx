import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.message || "Invalid email or password");
        return;
      }

      const storage = localStorage
      if (data.token) {
        storage.setItem("token", data.token);
      }
      storage.setItem("username", data.username ?? email);
      storage.setItem("role", data.role ?? role);

      navigate("/dashboard");
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
                "rounded-lg border px-3 py-2 text-sm transition hover:cursor-pointer hover:scale-101",
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
                "rounded-lg border px-3 py-2 text-sm transition hover:cursor-pointer hover:scale-101",
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
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600"
            />
          </div>
        </Field>

        {/* Password */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password" className="text-slate-300">
              Password
            </FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline text-slate-400"
            >
              Forgot your password?
            </a>
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
              className="pl-9 pr-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600"
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

        {/* Remember */}
        <Field>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-slate-200"
              />
              Remember me
            </label>
          </div>
        </Field>

        {/* Submit */}
        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 hover:cursor-pointer hover:scale-103"
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
