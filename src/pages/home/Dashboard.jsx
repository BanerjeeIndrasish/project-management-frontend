import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    AlertTriangle,
    AlertCircle,
    Info,
    RefreshCw,
    ChevronDown,
    Clock,
} from "lucide-react";
import { callApiWithToken } from "../../api/callApi";
import { useAuth } from "../../context/AuthContext";
import DashboardStats from '../../components/UI/DashboardStats';

// ---- Severity styling, kept in one place so cards, badges and the icon all agree ----
const SEVERITY = {
    critical: {
        icon: AlertCircle,
        label: "Critical",
        ring: "ring-rose-200",
        badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        iconWrap: "bg-rose-100 text-rose-600",
        glow: "from-rose-500/10",
    },
    warning: {
        icon: AlertTriangle,
        label: "Needs attention",
        ring: "ring-amber-200",
        badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        iconWrap: "bg-amber-100 text-amber-600",
        glow: "from-amber-500/10",
    },
    info: {
        icon: Info,
        label: "Info",
        ring: "ring-sky-200",
        badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
        iconWrap: "bg-sky-100 text-sky-600",
        glow: "from-sky-500/10",
    },
};

const SEVERITY_ORDER = ["critical", "warning", "info"];

// ---- One insight card ----
const InsightCard = ({ insight, index }) => {
    const [expanded, setExpanded] = useState(false);
    const s = SEVERITY[insight.severity] ?? SEVERITY.info;
    const Icon = s.icon;
    const isLong = insight.detail.length > 110;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
            className={`group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ${s.ring} shadow-sm transition-shadow hover:shadow-md`}
        >
            {/* soft directional glow, purely decorative */}
            <div
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${s.glow} to-transparent blur-2xl`}
                aria-hidden
            />

            <div className="relative flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconWrap}`}>
                    <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.badge}`}>
                            {s.label}
                        </span>
                        {insight.metric && (
                            <span className="text-[11px] font-medium text-slate-400">{insight.metric}</span>
                        )}
                    </div>

                    <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">{insight.title}</h3>

                    <p
                        className={`mt-1.5 text-sm leading-relaxed text-slate-500 ${!expanded && isLong ? "line-clamp-2" : ""
                            }`}
                    >
                        {insight.detail}
                    </p>

                    {isLong && (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                        >
                            {expanded ? "Show less" : "Read more"}
                            <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ---- Loading skeleton, mirrors the real card's proportions ----
const SkeletonCard = ({ index }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm"
    >
        <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2.5">
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            </div>
        </div>
    </motion.div>
);

const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
        <Sparkles className="mb-3 text-slate-300" size={28} />
        <p className="font-semibold text-slate-600">No insights right now</p>
        <p className="mt-1 text-sm text-slate-400">Check back after more activity is logged.</p>
    </div>
);

const ErrorState = ({ message, onRetry }) => (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 py-14 text-center">
        <AlertCircle className="mb-3 text-rose-400" size={28} />
        <p className="font-semibold text-rose-700">Couldn't load insights</p>
        <p className="mt-1 max-w-sm text-sm text-rose-500">{message}</p>
        <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
        >
            <RefreshCw size={14} /> Try again
        </button>
    </div>
);

const INSIGHTS = [
    {
        "title": "Critical Drop in Logged Time Across Portfolio",
        "detail": "Only 5.0 hours have been logged across all 12 active projects over the past 14 days.",
        "severity": "critical",
        "metric": "5.0 hrs logged in 14 days"
    },
    {
        "title": "Systemic Milestone Slippage Across All Active Projects",
        "detail": "There are over 100 tasks currently overdue across 12 active projects.",
        "severity": "critical",
        "metric": "100+ overdue tasks"
    },
    {
        "title": "Core Technical Mechanics Delayed in High-Priority Backlog",
        "detail": "Multiple critical tasks are past due, including Blake The-Verse multiple modules.",
        "severity": "warning",
        "metric": "25+ high-priority overdue tasks"
    },
    {
        "title": "Inappropriate Task Name Flagged in Rift Arena",
        "detail": "An overdue high-priority task in Rift Arena is titled inappropriately.",
        "severity": "warning",
        "metric": "Task Hygiene Alert"
    }
]

export default function Dashboard() {
    const { user } = useAuth();
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const verifyAuth = async () => {
        try {
            const res = await callApiWithToken({ url: '/auth/verify' });
            if (!res?.status) throw new Error(res.message || "Auth verification failed.");
        } catch (err) {
            setError(err.message || "Auth verification failed.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const load = async (forceRefresh = false) => {
        forceRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        try {
            const res = await callApiWithToken({ url: forceRefresh ? '/dashboard/insights?refresh=true' : '/dashboard/insights' });
            if (!res?.status) throw new Error(res.message || "Request failed.");
            setInsights(res.insights);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.message || "Something went wrong.");
            setInsights(INSIGHTS)
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        verifyAuth();

        const timer = setTimeout(() => {
            setInsights(INSIGHTS);
            setLoading(false);
        }, 2500);

        return () => clearTimeout(timer)
    }, []);

    const sorted = [...insights].sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    );
    const criticalCount = insights.filter((i) => i.severity === "critical").length;

    return (
        <section className="w-full min-h-screen bg-[#FAFAF9] p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <div className="flex items-end justify-start gap-2">
                            <h2 className="text-lg font-bold text-slate-900">AI Insights</h2>
                            <span>
                                {criticalCount > 0 && (
                                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                                        <AlertCircle size={12} /> {criticalCount} critical
                                    </span>
                                )}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            {lastUpdated
                                ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "Generated from your live project data"}
                        </p>
                    </div>
                    {/* {criticalCount > 0 && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                            <AlertCircle size={12} /> {criticalCount} critical
                        </span>
                    )} */}
                </div>

                {user?.role_code != 'guest' && <button
                    onClick={() => load(true)}
                    disabled={refreshing || loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {error && insights?.length == 0 ? (
                    <ErrorState message={error} onRetry={() => load(true)} />
                ) : loading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} index={i} />)
                ) : sorted.length === 0 ? (
                    <EmptyState />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {sorted.map((insight, i) => (
                            <InsightCard key={insight.title} insight={insight} index={i} />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <DashboardStats />
        </section>
    );
}