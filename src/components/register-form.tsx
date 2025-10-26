import * as React from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
// student creation deferred to login flow (consumed by login-form)
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// optional: set VITE_API_URL=http://localhost:8081 in your frontend .env
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";
type Role = "STUDENT" | "STAFF";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const location = useLocation();
  // allow preselect via /register?role=STAFF
  const initialRoleParam = new URLSearchParams(location.search).get("role");
  const [role, setRole] = React.useState<Role>(
    (initialRoleParam === "STAFF" || initialRoleParam === "STUDENT")
      ? (initialRoleParam as Role)
      : "STUDENT"
  );

  const [fullName, setFullName] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [studentIdTouched, setStudentIdTouched] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const passwordIssues = React.useMemo(() => {
    const issues: string[] = [];
    if (password.length < 8) issues.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) issues.push("1 uppercase letter");
    if (!/[a-z]/.test(password)) issues.push("1 lowercase letter");
    if (!/[0-9]/.test(password)) issues.push("1 number");
    return issues;
  }, [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    // if registering as student, require a student id
    if (role === "STUDENT" && !studentId.trim()) {
      setErrorMsg("Student ID is required for student accounts.");
      return;
    }
    // validate student id format
    const studentIdPattern = /^S\d{8}$/;
    if (role === "STUDENT" && studentId && !studentIdPattern.test(studentId)) {
      setErrorMsg("Student ID must start with 'S' followed by 8 digits, e.g. S12345678.");
      return;
    }
    if (passwordIssues.length > 0) {
      setErrorMsg("Please meet the password requirements.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include",
        body: JSON.stringify({
          name: fullName || undefined,
          email,
          password,
          role,
        }),
      });

  const data = await res.json().catch(() => ({} as unknown as { success?: boolean; token?: string; message?: string; username?: string; role?: string }));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.message || "Unable to create account");
        return;
      }

      // If backend returns token -> go straight in
      if (data.token) {
        // store username/role but do not persist token for students (require login)
        try {
          sessionStorage.setItem("username", data.username ?? email);
          sessionStorage.setItem("role", data.role ?? role);
        } catch {
          // ignore storage errors
        }

        // If the new account is a STUDENT, defer creating the Student record until
        // after the user logs in. Save the pending student payload in sessionStorage
        // and redirect the user to the login page.
        if ((data.role ?? role) === "STUDENT") {
          const pending = {
            studentId: studentId,
            name: fullName || undefined,
            email: email || undefined,
            username: email || undefined,
            phone: undefined,
            faceData: null,
          };
          try {
            sessionStorage.setItem("pendingStudent", JSON.stringify(pending));
          } catch {
            // ignore storage errors
          }
          navigate("/login", { state: { flash: "Account created. Please sign in to complete enrollment." } });
          return;
        }

        // For non-student (staff), keep previous behavior and log them in
        sessionStorage.setItem("token", data.token);
        navigate((data.role ?? role) === "STAFF" ? "/login" : "/login");
        toast.success('Successfully made account, time to login.')
        return;
      }

      // Else redirect to login
      setSuccessMsg("Account created! Redirecting to sign in…");
      setTimeout(() => {
        navigate("/login", { state: { flash: "Your account is ready. Please sign in." } });
      }, 800);
    } catch (err) {
      console.error("Register error", err);
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
      {/* borderless, slate look */}
      <FieldGroup className="bg-transparent rounded-xl p-6">
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="text-sm text-slate-400">Register to get started</p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-600/40 bg-red-600/10 px-4 py-3 text-sm text-red-300">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Role */}
        <Field>
          <FieldLabel className="text-slate-300">Account type</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              aria-pressed={role === "STUDENT"}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition",
                role === "STUDENT"
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              )}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("STAFF")}
              aria-pressed={role === "STAFF"}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition",
                role === "STAFF"
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              )}
            >
              Staff
            </button>
          </div>
        </Field>

        {/* Full name (optional) */}
        <Field>
          <FieldLabel htmlFor="fullname" className="text-slate-300">
            Full Name (optional)
          </FieldLabel>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="fullname"
              type="text"
              placeholder="Prof. Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 rounded-2xl"
            />
          </div>
        </Field>

        {/* Student ID (only for STUDENT role) */}
        {role === "STUDENT" && (
          <Field>
            <FieldLabel htmlFor="studentId" className="text-slate-300">
              Student ID
            </FieldLabel>
            <div className="relative">
              {/* reuse User icon for now */}
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="studentId"
                type="text"
                placeholder="S12345678"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onBlur={() => setStudentIdTouched(true)}
                autoComplete="off"
                className="pl-9 bg-slate-950 rounded-2xl border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 roundex-2xl"
              />
            </div>
            {/* Inline validation */}
            {studentIdTouched && studentId && !/^S\d{8}$/.test(studentId) && (
              <p className="mt-2 text-sm text-red-400">Student ID must start with 'S' followed by 8 digits (e.g. S12345678).</p>
            )}
          </Field>
        )}

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
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 rounded-2xl"
            />
          </div>
        </Field>

        {/* Password */}
        <Field>
          <FieldLabel htmlFor="password" className="text-slate-300">
            Password
          </FieldLabel>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
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

          {/* Hints */}
          <ul className="mt-2 text-xs text-slate-400 space-y-1">
            <li>Use a strong password with:</li>
            <li className={password.length >= 8 ? "text-emerald-400" : ""}>• At least 8 characters</li>
            <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>• 1 uppercase letter</li>
            <li className={/[a-z]/.test(password) ? "text-emerald-400" : ""}>• 1 lowercase letter</li>
            <li className={/[0-9]/.test(password) ? "text-emerald-400" : ""}>• 1 number</li>
          </ul>
        </Field>

        {/* Confirm password */}
        <Field>
          <FieldLabel htmlFor="confirm" className="text-slate-300">
            Confirm Password
          </FieldLabel>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="pl-9 pr-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirm && confirm !== password && (
            <p className="mt-2 text-sm text-red-400">Passwords do not match.</p>
          )}
        </Field>

        {/* Submit */}
        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-2xl"
          >
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </Field>

        {/* Already have account */}
        <div className="mt-2 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to={`/login`}
            className="underline underline-offset-4 hover:text-slate-200"
          >
            Sign in
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
