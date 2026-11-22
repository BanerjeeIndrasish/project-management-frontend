import { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
    Cell,
} from "recharts";
import { ListChecks, Clock3, FolderKanban, AlertTriangle, RefreshCw } from "lucide-react";
import { callApiWithToken } from "../../api/callApi";

const STATUS_COLORS = {
    Completed: "#2F8F6B",
    "In Progress": "#0F5257",
    Pending: "#8891A1",
    Active: "#0F5257",
    "On Hold": "#D98E3F",
};
const FALLBACK_COLOR = "#5B7FBF";

const mock = {
    "status": true,
    "stats": {
        "totalTasks": 187,
        "totalHours": 42.5,
        "activeProjects": 12,
        "overdueCount": 23,
        "taskStatus": [
            { "status": "Completed", "count": 98 },
            { "status": "In Progress", "count": 41 },
            { "status": "Pending", "count": 25 },
            { "status": "Overdue", "count": 23 }
        ],
        "projectStatus": [
            { "status": "Active", "count": 12 },
            { "status": "On Hold", "count": 3 },
            { "status": "Completed", "count": 7 }
        ],
        "hoursByDay": [
            { "day": "2026-09-14", "hours": 4.5 },
            { "day": "2026-09-15", "hours": 3.0 },
            { "day": "2026-09-16", "hours": 5.5 },
            { "day": "2026-09-17", "hours": 2.0 },
            { "day": "2026-09-18", "hours": 0 },
            { "day": "2026-09-19", "hours": 1.5 },
            { "day": "2026-09-20", "hours": 6.0 },
            { "day": "2026-09-21", "hours": 3.5 },
            { "day": "2026-09-22", "hours": 4.0 },
            { "day": "2026-09-23", "hours": 2.5 },
            { "day": "2026-09-24", "hours": 0.5 },
            { "day": "2026-09-25", "hours": 3.0 },
            { "day": "2026-09-26", "hours": 5.0 },
            { "day": "2026-09-27", "hours": 1.0 }
        ],
        "workload": [
            { "name": "Indrasish", "hours": 14.5 },
            { "name": "Dhritiraj", "hours": 11.0 },
            { "name": "Dibyajyoti", "hours": 8.5 },
            { "name": "Debanuj", "hours": 6.0 },
            { "name": "Sourav", "hours": 2.5 },
            { "name": "Rohan", "hours": 0 }
        ]
    }
}

function StatTile({ icon: Icon, label, value, accent }) {
    // console.log('Statsss........', label)
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-[#E4E2DD] bg-white p-4">
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accent ?? "#0F5257"}1A`, color: accent ?? "#0F5257" }}
            >
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs text-[#6B7280]">{label}</p>
                <p className="text-xl font-semibold text-[#1A1D1F]">{value}</p>
            </div>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="rounded-2xl border border-[#E4E2DD] bg-white p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-semibold text-[#1A1D1F]">{title}</h3>
            {children}
        </div>
    );
}

function ChartSkeleton() {
    return <div className="h-52 w-full animate-pulse rounded-lg bg-[#F0EFEB]" />;
}

export default function DashboardStats({ endpoint = "/dashboard/stats" }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await callApiWithToken({ url: endpoint });
            if (!res.status) throw new Error("Request failed.");
            // console.log('Ressssssssssssssssssss', res, res.data)
            setStats(res.data);
        } catch (err) {
            setError(err.message || "Couldn't load dashboard stats.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setStats(mock?.stats)
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center mt-6 rounded-2xl border border-dashed border-[#E4E2DD] bg-white py-12 text-center">
                <AlertTriangle className="mb-3 text-[#B3432B]" size={24} />
                <p className="font-semibold text-[#1A1D1F]">Couldn't load statistics</p>
                <p className="mt-1 text-sm text-[#6B7280]">{error}</p>
                <button
                    onClick={load}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#E4E2DD] px-3 py-1.5 text-sm font-medium hover:bg-[#F0EFEB]"
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    return (
        <section className="w-full space-y-4 mt-6">
            {/* Top-line numbers */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {loading || !stats ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-[#F0EFEB]" />
                    ))
                ) : (
                    <>
                        <StatTile icon={ListChecks} label="Total tasks" value={stats.totalTasks} />
                        <StatTile icon={Clock3} label="Hours logged" value={stats.totalHours.toFixed(1)} />
                        <StatTile icon={FolderKanban} label="Active projects" value={stats.activeProjects} />
                        <StatTile icon={AlertTriangle} label="Overdue tasks" value={stats.overdueCount} accent="#B3432B" />
                    </>
                )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Hours logged — last 14 days">
                    {loading || !stats ? (
                        <ChartSkeleton />
                    ) : (
                        <ResponsiveContainer width="100%" height={210}>
                            <LineChart data={stats.hoursByDay} margin={{ left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DD" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    tick={{ fontSize: 11, fill: "#6B7280" }}
                                    axisLine={{ stroke: "#E4E2DD" }}
                                    tickLine={false}
                                />
                                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: "1px solid #E4E2DD", fontSize: 12 }}
                                    labelFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                />
                                <Line type="monotone" dataKey="hours" stroke="#0F5257" strokeWidth={2.5} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Tasks by status">
                    {loading || !stats ? (
                        <ChartSkeleton />
                    ) : stats.taskStatus.length === 0 ? (
                        <p className="py-16 text-center text-sm text-[#9AA0A6]">No tasks yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={210}>
                            <BarChart data={stats.taskStatus} margin={{ left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DD" vertical={false} />
                                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#E4E2DD" }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E2DD", fontSize: 12 }} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {stats.taskStatus.map((entry, i) => (
                                        <Cell key={i} fill={STATUS_COLORS[entry.status] ?? FALLBACK_COLOR} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Projects by status">
                    {loading || !stats ? (
                        <ChartSkeleton />
                    ) : stats.projectStatus.length === 0 ? (
                        <p className="py-16 text-center text-sm text-[#9AA0A6]">No projects yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={210}>
                            <BarChart data={stats.projectStatus} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DD" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <YAxis
                                    type="category"
                                    dataKey="status"
                                    tick={{ fontSize: 11, fill: "#6B7280" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={90}
                                />
                                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E2DD", fontSize: 12 }} />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                    {stats.projectStatus.map((entry, i) => (
                                        <Cell key={i} fill={STATUS_COLORS[entry.status] ?? FALLBACK_COLOR} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Workload — hours logged, last 14 days">
                    {loading || !stats ? (
                        <ChartSkeleton />
                    ) : stats.workload.every((w) => w.hours === 0) ? (
                        <p className="py-16 text-center text-sm text-[#9AA0A6]">No hours logged recently.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={210}>
                            <BarChart data={stats.workload} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DD" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: "#6B7280" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                />
                                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E2DD", fontSize: 12 }} />
                                <Bar dataKey="hours" fill="#0F5257" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>
        </section>
    );
}