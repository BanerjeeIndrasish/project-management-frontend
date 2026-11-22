import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserRound, AlertCircle } from "lucide-react";

function Logomark({ size = 22 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M9 8v12M13 8v12M17 8v12" stroke="#DCEEEE" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 19.5 19 7.5" stroke="#D98E3F" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// Slow-drifting glow blobs, same ambient treatment as the sidebar.
function AmbientGlow() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <motion.div
                className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#0F5257]/50 blur-3xl"
                animate={{ y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#D98E3F]/25 blur-3xl"
                animate={{ y: [0, -18, 0], opacity: [0.4, 0.65, 0.4] }}
                transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            />
        </div>
    );
}

// Small particles drifting upward — purely decorative, positions are
// deterministic (not Math.random) so server/client renders never mismatch.
function Particles() {
    const particles = Array.from({ length: 16 });
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {particles.map((_, i) => {
                const size = 2 + ((i * 5) % 4);
                const left = (i * 61) % 100;
                const delay = (i % 8) * 0.7;
                const duration = 9 + (i % 5) * 1.8;
                return (
                    <motion.span
                        key={i}
                        className="absolute rounded-full bg-white/25"
                        style={{ width: size, height: size, left: `${left}%`, bottom: -16 }}
                        animate={{ y: [0, -460], opacity: [0, 0.7, 0] }}
                        transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
                    />
                );
            })}
        </div>
    );
}

const Login = () => {
    const navigate = useNavigate();
    const { login, guestLogin } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError("Enter your email and password to continue.");
            return;
        }
        setError(null);
        setSubmitting(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGuestLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setGuestLoading(true);

        try {
            await guestLogin();
            navigate('/');
        } catch (err) {
            alert(err.message);
        } finally {
            setGuestLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-[#FAFAF9]">
            {/* Brand panel — hidden on small screens */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B3335] to-[#082628] p-10 lg:flex xl:p-14">
                <AmbientGlow />
                <Particles />

                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                        <Logomark />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-white">DevFlow</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="relative z-10 max-w-md"
                >
                    <h1 className="text-3xl font-semibold leading-snug text-white xl:text-4xl">
                        Every project, task and hour — in one place.
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-[#9FC2C3] xl:text-base">
                        Sign in to pick up where you left off, or explore as a guest to see how DevFlow works.
                    </p>
                </motion.div>

                <p className="relative z-10 text-xs text-[#5F8B8C]">© {new Date().getFullYear()} DevFlow. All rights reserved.</p>
            </div>

            {/* Form panel */}
            <div className="flex w-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">
                {/* Compact brand header, shown only when the side panel is hidden */}
                <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F5257]/10">
                        <Logomark size={18} />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-[#1A1D1F]">DevFlow</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="w-full max-w-sm rounded-2xl border border-[#E4E2DD] bg-white p-7 shadow-sm sm:p-8"
                >
                    <h2 className="text-2xl font-semibold text-[#1A1D1F]">Welcome back 👋</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">Sign in to your DevFlow account.</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4 flex items-start gap-2 rounded-lg border border-[#B3432B]/30 bg-[#B3432B]/5 px-3 py-2.5 text-sm text-[#B3432B]"
                        >
                            <AlertCircle size={15} className="mt-0.5 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="relative">
                            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA0A6]" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                autoComplete="email"
                                className="w-full rounded-xl border border-[#E4E2DD] bg-[#FAFAF9] py-2.5 pl-10 pr-4 text-sm text-[#1A1D1F] placeholder:text-[#9AA0A6] transition focus:border-[#0F5257] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5257]/15"
                            />
                        </div>

                        <div className="relative">
                            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA0A6]" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                autoComplete="current-password"
                                className="w-full rounded-xl border border-[#E4E2DD] bg-[#FAFAF9] py-2.5 pl-10 pr-10 text-sm text-[#1A1D1F] placeholder:text-[#9AA0A6] transition focus:border-[#0F5257] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5257]/15"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-[#4B5058]"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={submitting}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F5257] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0C4448] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Signing in…" : "Login"}
                            {!submitting && <ArrowRight size={15} />}
                        </motion.button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <span className="h-px flex-1 bg-[#E4E2DD]" />
                        <span className="text-xs text-[#9AA0A6]">or</span>
                        <span className="h-px flex-1 bg-[#E4E2DD]" />
                    </div>

                    <motion.button
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={guestLoading}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E4E2DD] py-2.5 text-sm font-semibold text-[#1A1D1F] transition hover:bg-[#F0EFEB] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <UserRound size={15} />
                        {guestLoading ? "Starting guest session…" : "Continue as guest"}
                    </motion.button>

                    {/* <p className="mt-6 text-center text-sm text-[#6B7280]">
                        Don't have an account?{" "}
                        <a href="/register" className="font-medium text-[#0F5257] hover:underline">
                            Sign up
                        </a>
                    </p> */}
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
