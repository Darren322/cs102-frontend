import { useState, useMemo } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';


// optional: set VITE_API_URL=http://localhost:8081 in your frontend .env
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081';
type Role = 'STUDENT' | 'STAFF';

export default function RegisterPage() {
    const [role, setRole] = useState<Role>('STUDENT');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const navigate = useNavigate();

    const passwordIssues = useMemo(() => {
        const issues: string[] = [];
        if (password.length < 8) issues.push('At least 8 characters');
        if (!/[A-Z]/.test(password)) issues.push('1 uppercase letter');
        if (!/[a-z]/.test(password)) issues.push('1 lowercase letter');
        if (!/[0-9]/.test(password)) issues.push('1 number');
        return issues;
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (password !== confirm) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        if (passwordIssues.length > 0) {
            setErrorMsg('Please meet the password requirements.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // If your backend sets cookies instead of returning a token:
                // credentials: 'include',
                body: JSON.stringify({
                    name: fullName || undefined,
                    email,
                    password,
                    role
                }),
            });

            const data = await res.json().catch(() => ({}));
            console.log(data);
            console.log("success");
            if (!res.ok || !data?.success) {
                setErrorMsg(data?.message || 'Unable to create account');
                return;
            }

            // If your backend returns a token on successful registration, persist and go to app:
            if (data.token) {
                console.log(data);
                  console.log("token inserted");
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('username', data.username ?? email);
                sessionStorage.setItem('role', data.role ?? '');
                navigate((data.role ?? role) === 'STAFF' ? '/sessions' : '/dashboard');
                return;
            }

            // Otherwise, send users to login with a flash message
            setSuccessMsg('Account created! Redirecting to sign in…');
            setTimeout(() => {
                navigate('/login', { state: { flash: 'Your account is ready. Please sign in.' } });
            }, 800);
        } catch (err) {
            console.error('Register error', err);
            setErrorMsg('Unable to reach server at ' + API_URL);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 w-full overflow-y-auto">
            <div className="w-full max-w-md ">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 ">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                        <p className="text-gray-600">Professor Dashboard Registration</p>
                    </div>

                    {/* Alerts */}
                    {errorMsg && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
                            {successMsg}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name (optional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="fullname"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                                    placeholder="Prof. Jane Doe"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                                    placeholder="professor@university.edu"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Type
                            </label>
                            <div className="flex gap-3">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="STUDENT"
                                        checked={role === 'STUDENT'}
                                        onChange={() => setRole('STUDENT')}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Student</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="STAFF"
                                        checked={role === 'STAFF'}
                                        onChange={() => setRole('STAFF')}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Staff</span>
                                </label>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>

                            {/* Password hints */}
                            <ul className="mt-2 text-xs text-gray-500 space-y-1">
                                <li>Use a strong password with:</li>
                                <li className={password.length >= 8 ? 'text-green-600' : ''}>• At least 8 characters</li>
                                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>• 1 uppercase letter</li>
                                <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>• 1 lowercase letter</li>
                                <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>• 1 number</li>
                            </ul>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    id="confirm"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((s) => !s)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {confirm && confirm !== password && (
                                <p className="mt-2 text-sm text-red-600">Passwords do not match.</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                    </div>

                    {/* Already have an account */}
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer */}

            </div>
        </div>
    );
}
