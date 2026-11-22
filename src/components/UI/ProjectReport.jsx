import { Children, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, SearchX, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Keep in sync with the palette used across Header/Home/Projects/About
const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontMono = { fontFamily: "'IBM Plex Mono', monospace" };

/* -------------------------------------------------------------------------- */
/*  Shared vocab                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_META = {
    completed: { label: 'Completed', color: '#2F8F6B', ink: '#1F6B4F' },
    in_progress: { label: 'In progress', color: '#C6772E', ink: '#9A5A1A' },
    pending: { label: 'Pending', color: '#8891A1', ink: '#5B6472' },
    overdue: { label: 'Overdue', color: '#B3402E', ink: '#B3402E' },
    other: { label: 'Other', color: '#B8BFCB', ink: '#5B6472' },
};
const STATUS_ORDER = ['completed', 'in_progress', 'pending', 'overdue', 'other'];

function normStatus(raw) {
    const k = String(raw ?? '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (['completed', 'complete', 'done'].includes(k)) return 'completed';
    if (['in_progress', 'inprogress', 'ongoing', 'started'].includes(k)) return 'in_progress';
    if (['pending', 'todo', 'to_do', 'open', 'not_started'].includes(k)) return 'pending';
    if (['overdue', 'late'].includes(k)) return 'overdue';
    return 'other';
}

function segmentsFromKeys(keys) {
    const acc = {};
    keys.forEach((k) => {
        acc[k] = (acc[k] || 0) + 1;
    });
    return STATUS_ORDER.filter((k) => acc[k]).map((k) => ({
        key: k,
        label: STATUS_META[k].label,
        color: STATUS_META[k].color,
        value: acc[k],
    }));
}

const PRIORITY_LEVEL = { low: 1, medium: 2, med: 2, normal: 2, high: 3, urgent: 3, critical: 3 };
const PRIORITY_BUCKETS = [
    { level: 3, key: 'high', label: 'High', color: '#151A24' },
    { level: 2, key: 'medium', label: 'Medium', color: '#5B6472' },
    { level: 1, key: 'low', label: 'Low', color: '#B8BFCB' },
    { level: 0, key: 'none', label: 'Unset', color: '#E1E5EB' },
];

function priorityInfo(raw) {
    if (raw === null || raw === undefined || raw === '') return { label: 'No priority', level: 0 };
    const text = String(raw);
    const level = PRIORITY_LEVEL[text.toLowerCase().trim()] ?? 0;
    return { label: text.charAt(0).toUpperCase() + text.slice(1), level };
}

function prioritySegments(tasks) {
    return PRIORITY_BUCKETS.map((b) => ({
        key: b.key,
        label: b.label,
        color: b.color,
        value: tasks.filter((t) => priorityInfo(t.priority).level === b.level).length,
    })).filter((s) => s.value > 0);
}

const fmtHours = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// Recursively pulls plain text out of React children (an h4 whose only child
// is a <strong> won't be seen by Children.toArray + join alone).
function extractText(children) {
    return Children.toArray(children)
        .map((child) => {
            if (typeof child === 'string') return child;
            if (child?.props?.children) return extractText(child.props.children);
            return '';
        })
        .join('');
}

/* -------------------------------------------------------------------------- */
/*  What kind of result is this?                                              */
/* -------------------------------------------------------------------------- */

// Used by ChatBox too, so the chat bubble and the modal always agree.
// An explicit `type` from the backend wins; the shape checks keep older
// responses (no `type` field) working.
export function detectResultKind(result) {
    if (!result || typeof result !== 'object') return 'text';
    if (result.type === 'KNOWLEDGE_SEARCH') return 'search';
    if (result.type === 'PROJECT_STATUS') return 'status';
    if (Array.isArray(result.tasks)) return result.projectName ? 'status' : 'search';
    if (result.projectName) return 'status';
    return 'text';
}

/* -------------------------------------------------------------------------- */
/*  Data models                                                               */
/* -------------------------------------------------------------------------- */

// Fallback only: when the backend sends no structured rows we scrape rough
// numbers out of the LLM's markdown. Real rows (below) always win.
const STATUS_PATTERNS = [
    { key: 'completed', re: /completed[^\d]{0,20}(\d+)/i },
    { key: 'in_progress', re: /in[\s_-]*progress[^\d]{0,20}(\d+)/i },
    { key: 'pending', re: /pending[^\d]{0,20}(\d+)/i },
    { key: 'overdue', re: /overdue[^\d]{0,20}(\d+)/i },
];

function extractStatusBreakdown(text) {
    if (!text) return [];
    return STATUS_PATTERNS.map(({ key, re }) => {
        const match = text.match(re);
        const value = match ? Number(match[1]) : 0;
        return value > 0
            ? { key, label: STATUS_META[key].label, color: STATUS_META[key].color, value }
            : null;
    }).filter(Boolean);
}

function extractHoursLogged(text) {
    const match = text?.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours)\b/i);
    return match ? Number(match[1]) : null;
}

function extractFlagCount(text) {
    const matches = text?.match(/^####?\s*flag\b/gim);
    return matches ? matches.length : 0;
}

function buildStatusModel(result, content) {
    const rows = Array.isArray(result?.tasks) ? result.tasks : [];
    const flags = extractFlagCount(content);

    if (rows.length > 0) {
        const tasks = rows.map((r) => ({
            title: r.task_title ?? r.title ?? 'Untitled task',
            rawStatus: r.status,
            status: normStatus(r.status),
            hours: Number(r.total_hours_logged ?? r.hours ?? 0) || 0,
        }));
        return {
            tasks,
            breakdown: segmentsFromKeys(tasks.map((t) => t.status)),
            totalHours: tasks.reduce((s, t) => s + t.hours, 0),
            flags,
        };
    }

    return {
        tasks: [],
        breakdown: extractStatusBreakdown(content),
        totalHours: extractHoursLogged(content),
        flags,
    };
}

function buildSearchModel(result) {
    const raw = Array.isArray(result?.tasks) ? result.tasks : [];
    const tasks = raw.map((t, i) => ({
        rank: i + 1,
        id: t.id,
        projectId: t.project_id ?? t.projectId,
        projectName: t.project_name ?? t.projectName,
        title: t.title ?? 'Untitled task',
        description: typeof t.description === 'string' ? t.description : '',
        status: normStatus(t.status),
        rawStatus: t.status,
        priority: t.priority,
        score: typeof t.score === 'number' ? t.score : null,
    }));
    return { query: typeof result?.query === 'string' ? result.query : '', tasks };
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

function StatChip({ label, value, accent }) {
    return (
        <div className="flex flex-col border border-[#C9CFD8] bg-white px-3 py-2">
            <span className="text-[11px] text-[#8891A1]">{label}</span>
            <span className="text-lg font-medium" style={{ ...fontDisplay, color: accent || '#151A24' }}>
                {value}
            </span>
        </div>
    );
}

function SectionTitle({ children }) {
    return <h3 className="mb-2 text-xs font-medium text-[#5B6472]">{children}</h3>;
}

function StatusPill({ statusKey, raw }) {
    const meta = STATUS_META[statusKey] ?? STATUS_META.other;
    const label = statusKey === 'other' && raw ? String(raw) : meta.label;
    return (
        <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${meta.color}1F`, color: meta.ink }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            {label}
        </span>
    );
}

// Three ascending bars — readable without relying on colour alone.
function PriorityBars({ level }) {
    return (
        <span className="flex items-end gap-0.5" aria-hidden="true">
            {[1, 2, 3].map((n) => (
                <span
                    key={n}
                    className="w-1"
                    style={{ height: `${4 + n * 3}px`, backgroundColor: n <= level ? '#151A24' : '#D5DAE1' }}
                />
            ))}
        </span>
    );
}

function SegmentedBar({ segments, reduce }) {
    const total = segments.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;
    return (
        <div>
            <div
                className="flex h-2 w-full overflow-hidden bg-[#EEF0F3]"
                role="img"
                aria-label={segments.map((d) => `${d.label} ${d.value}`).join(', ')}
            >
                {segments.map((d) => (
                    <motion.div
                        key={d.key}
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${(d.value / total) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{ backgroundColor: d.color }}
                    />
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {segments.map((d) => (
                    <span key={d.key} className="flex items-center gap-1.5 text-xs text-[#5B6472]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.label} <span className="font-medium text-[#151A24]">{d.value}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function Donut({ segments, centerValue, centerLabel, reduce }) {
    const R = 44;
    const C = 2 * Math.PI * R;
    const total = segments.reduce((s, d) => s + d.value, 0);
    let offset = 0;

    return (
        <svg
            viewBox="0 0 120 120"
            className="h-32 w-32 shrink-0"
            role="img"
            aria-label={`${centerValue} ${centerLabel}`}
        >
            <circle cx="60" cy="60" r={R} fill="none" stroke="#EEF0F3" strokeWidth="12" />
            <g transform="rotate(-90 60 60)">
                {total > 0 &&
                    segments.map((s) => {
                        const len = (s.value / total) * C;
                        const circle = (
                            <motion.circle
                                key={s.key}
                                cx="60"
                                cy="60"
                                r={R}
                                fill="none"
                                stroke={s.color}
                                strokeWidth="12"
                                strokeDashoffset={-offset}
                                initial={reduce ? false : { strokeDasharray: `0 ${C}` }}
                                animate={{ strokeDasharray: `${len} ${C - len}` }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                        );
                        offset += len;
                        return circle;
                    })}
            </g>
            <text
                x="60"
                y="60"
                textAnchor="middle"
                fontSize="22"
                fontWeight="500"
                fill="#151A24"
                style={fontDisplay}
            >
                {centerValue}
            </text>
            <text x="60" y="76" textAnchor="middle" fontSize="9" fill="#8891A1">
                {centerLabel}
            </text>
        </svg>
    );
}

/* -------------------------------------------------------------------------- */
/*  Markdown                                                                  */
/* -------------------------------------------------------------------------- */

const mdComponents = {
    h1: ({ children }) => (
        <h1 className="mb-1 text-2xl font-medium text-[#151A24] sm:text-3xl" style={fontDisplay}>
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="mb-3 mt-8 border-b border-[#C9CFD8] pb-2 text-lg font-medium text-[#151A24]" style={fontDisplay}>
            {children}
        </h2>
    ),
    h3: ({ children }) => <h3 className="mb-2 mt-6 text-base font-medium text-[#151A24]">{children}</h3>,
    h4: ({ children }) => {
        const isFlag = /^flag\b/i.test(extractText(children).trim());
        return isFlag ? (
            <h4 className="mb-2 mt-6 border-l-2 border-[#C6772E] bg-[#C6772E]/5 py-1 pl-3 text-sm font-medium text-[#151A24]">
                {children}
            </h4>
        ) : (
            <h4 className="mb-2 mt-5 text-sm font-medium text-[#151A24]">{children}</h4>
        );
    },
    p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-[#5B6472]">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-[#151A24]">{children}</strong>,
    em: ({ children }) => <em className="font-medium not-italic text-[#5B6472]">{children}</em>,
    // Native list markers: react-markdown v9 no longer passes `ordered`/`index`
    // to <li>, so the old custom numbering silently rendered "1." for everything.
    ul: ({ children }) => (
        <ul className="mb-4 list-disc space-y-1.5 pl-5 marker:text-[#C6772E]">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 marker:text-[#5B6472]">{children}</ol>
    ),
    li: ({ children }) => <li className="text-sm text-[#5B6472]">{children}</li>,
    hr: () => <hr className="my-6 border-[#C9CFD8]" />,
    code: ({ children }) => (
        <code className="bg-[#EEF0F3] px-1.5 py-0.5 text-xs text-[#151A24]" style={fontMono}>
            {children}
        </code>
    ),
    table: ({ children }) => (
        <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border-b border-[#C9CFD8] px-2 py-1.5 text-left text-xs font-medium text-[#151A24]">{children}</th>
    ),
    td: ({ children }) => <td className="border-b border-[#EEF0F3] px-2 py-1.5 text-[#5B6472]">{children}</td>,
};

/* -------------------------------------------------------------------------- */
/*  View: project status                                                      */
/* -------------------------------------------------------------------------- */

function StatusView({ model, content, reduce }) {
    const { tasks, breakdown, totalHours, flags } = model;
    const total = breakdown.reduce((s, d) => s + d.value, 0);
    const done = breakdown.find((d) => d.key === 'completed')?.value ?? 0;
    const overdue = breakdown.find((d) => d.key === 'overdue')?.value ?? 0;
    const pct = total ? Math.round((done / total) * 100) : null;

    const sorted = useMemo(() => [...tasks].sort((a, b) => b.hours - a.hours), [tasks]);
    const maxHours = Math.max(0, ...tasks.map((t) => t.hours));
    const hasInsights = total > 0 || totalHours !== null || flags > 0;

    return (
        <>
            {hasInsights && (
                <section className="mb-6 flex flex-col gap-5 border border-[#C9CFD8] bg-[#FAFAFA] p-4 sm:flex-row sm:items-center">
                    {total > 0 && (
                        <div className="flex justify-center sm:block">
                            <Donut segments={breakdown} centerValue={`${pct}%`} centerLabel="complete" reduce={reduce} />
                        </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                        {total > 0 && (
                            <ul className="space-y-1.5 mb-6">
                                {breakdown.map((d) => (
                                    <li key={d.key} className="flex items-center gap-2 text-xs text-[#5B6472]">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="flex-1">{d.label}</span>
                                        <span className="font-medium text-[#151A24]" style={fontMono}>
                                            {d.value}
                                        </span>
                                        <span className="w-9 text-right text-[#8891A1]" style={fontMono}>
                                            {Math.round((d.value / total) * 100)}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {total > 0 && <StatChip label="Tasks" value={total} />}
                            {totalHours !== null && <StatChip label="Hours logged" value={fmtHours(totalHours)} />}
                            {overdue > 0 && <StatChip label="Overdue" value={overdue} accent="#B3402E" />}
                            {flags > 0 && <StatChip label="Flags raised" value={flags} accent="#B3402E" />}
                        </div>
                    </div>
                </section>
            )}

            {sorted.length > 0 && (
                <section className="mb-6">
                    <SectionTitle>Time logged per task</SectionTitle>
                    <ul className="divide-y divide-[#EEF0F3] border border-[#C9CFD8] bg-white">
                        {sorted.map((t, i) => (
                            <li key={`${t.title}-${i}`} className="px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="min-w-0 truncate text-sm font-medium text-[#151A24]" title={t.title}>
                                        {t.title}
                                    </span>
                                    <StatusPill statusKey={t.status} raw={t.rawStatus} />
                                </div>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="h-1.5 flex-1 bg-[#EEF0F3]">
                                        <motion.div
                                            className="h-full"
                                            initial={reduce ? false : { width: 0 }}
                                            animate={{ width: maxHours ? `${(t.hours / maxHours) * 100}%` : '0%' }}
                                            transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.04, ease: 'easeOut' }}
                                            style={{ backgroundColor: STATUS_META[t.status].color }}
                                        />
                                    </div>
                                    <span className="w-14 text-right text-xs text-[#5B6472]" style={fontMono}>
                                        {t.hours > 0 ? `${fmtHours(t.hours)} h` : 'no time'}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section>
                {(hasInsights || sorted.length > 0) && <SectionTitle>Summary</SectionTitle>}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {content || ''}
                </ReactMarkdown>
            </section>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*  View: vector search results                                               */
/* -------------------------------------------------------------------------- */

function TaskCard({ task, reduce }) {
    const meta = STATUS_META[task.status];
    const { label: prioLabel, level } = priorityInfo(task.priority);
    const pct = task.score === null ? null : Math.round(Math.max(0, Math.min(1, task.score)) * 100);

    return (
        <motion.li
            layout={!reduce}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="border border-l-[3px] border-[#C9CFD8] bg-white px-4 py-3"
            style={{ borderLeftColor: meta.color }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 text-xs text-[#8891A1]" style={fontMono}>
                        #{task.rank}
                    </span>
                    <h4 className="text-sm font-medium text-[#151A24]">{task.title}</h4>
                </div>
                <StatusPill statusKey={task.status} raw={task.rawStatus} />
            </div>

            {task.description && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#5B6472]">{task.description}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5B6472]">
                <span className="flex items-center gap-1.5">
                    <PriorityBars level={level} />
                    {level > 0 ? `${prioLabel} priority` : prioLabel === 'No priority' ? prioLabel : `Priority ${prioLabel}`}
                </span>
                {(task.projectName || task.projectId) && (
                    <span className="truncate">{task.projectName || `Project ${task.projectId}`}</span>
                )}
                {task.id !== undefined && (
                    <span className="text-[#8891A1]" style={fontMono}>
                        task {task.id}
                    </span>
                )}
                {pct !== null && (
                    <span className="ml-auto flex items-center gap-2">
                        <span className="h-1 w-16 bg-[#EEF0F3]">
                            <motion.span
                                className="block h-full bg-[#C6772E]"
                                initial={reduce ? false : { width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                        </span>
                        <span style={fontMono}>{pct}% match</span>
                    </span>
                )}
            </div>
        </motion.li>
    );
}

function SearchView({ model, message, reduce }) {
    const [filter, setFilter] = useState('all');
    const { query, tasks } = model;

    const statusSegs = useMemo(() => segmentsFromKeys(tasks.map((t) => t.status)), [tasks]);
    const prioSegs = useMemo(() => prioritySegments(tasks), [tasks]);
    const visible = tasks.filter((t) => filter === 'all' || t.status === filter);

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF0F3] text-[#5B6472]">
                    <SearchX size={18} />
                </div>
                <p className="text-sm font-medium text-[#151A24]">No related tasks found</p>
                <p className="mt-1 max-w-sm text-sm text-[#5B6472]">
                    {message || 'Search matches on meaning, so try describing what the task does in different words.'}
                </p>
            </div>
        );
    }

    return (
        <>
            <header className="mb-5">
                <h2 className="text-xl font-medium text-[#151A24] sm:text-2xl" style={fontDisplay}>
                    {query ? `\u201C${query}\u201D` : 'Matching tasks'}
                </h2>
                <p className="mt-1 text-sm text-[#5B6472]">
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}, closest match first
                </p>
            </header>

            {tasks.length > 1 && (
                <section className="mb-5 grid gap-4 border border-[#C9CFD8] bg-[#FAFAFA] p-4 sm:grid-cols-2">
                    <div>
                        <SectionTitle>By status</SectionTitle>
                        <SegmentedBar segments={statusSegs} reduce={reduce} />
                    </div>
                    <div>
                        <SectionTitle>By priority</SectionTitle>
                        <SegmentedBar segments={prioSegs} reduce={reduce} />
                    </div>
                </section>
            )}

            {statusSegs.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                    {[{ key: 'all', label: 'All', value: tasks.length }, ...statusSegs].map((s) => {
                        const active = filter === s.key;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setFilter(s.key)}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6772E] ${active
                                        ? 'border-[#151A24] bg-[#151A24] text-white'
                                        : 'border-[#C9CFD8] bg-white text-[#5B6472] hover:border-[#8891A1]'
                                    }`}
                            >
                                {s.label} <span style={fontMono}>{s.value}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <ul className="space-y-2.5 mb-6">
                <AnimatePresence initial={false}>
                    {visible.map((t) => (
                        <TaskCard key={t.id ?? t.rank} task={t} reduce={reduce} />
                    ))}
                </AnimatePresence>
            </ul>
        </>
    );
}

export default function ReportModal({ isOpen, onClose, title, content, result }) {
    const reduce = useReducedMotion();
    const [copied, setCopied] = useState(false);

    const kind = useMemo(() => detectResultKind(result), [result]);
    const statusModel = useMemo(
        () => (kind === 'search' ? null : buildStatusModel(result, content)),
        [kind, result, content]
    );
    const searchModel = useMemo(() => (kind === 'search' ? buildSearchModel(result) : null), [kind, result]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);

    const handleCopy = async () => {
        const text =
            kind === 'search' && searchModel
                ? searchModel.tasks
                    .map(
                        (t) =>
                            `${t.rank}. ${t.title} (${STATUS_META[t.status].label}, ${priorityInfo(t.priority).label})` +
                            (t.description ? `\n   ${t.description}` : '')
                    )
                    .join('\n')
                : content || '';
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            // Clipboard can fail (permissions, insecure context) — fine to no-op silently.
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label={title || 'Report'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-[#151A24]/50 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.div
                        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col border border-[#C9CFD8] bg-white shadow-xl"
                        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#C9CFD8] px-5 py-4 sm:px-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="h-2 w-2 shrink-0 bg-[#C6772E]" />
                                <span className="truncate text-sm font-medium text-[#151A24]" style={fontDisplay}>
                                    {title || 'Status report'}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 rounded-sm p-1.5 text-xs text-[#5B6472] hover:bg-[#EEF0F3] hover:text-[#151A24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6772E]"
                                    aria-label="Copy report text"
                                >
                                    {copied ? <Check size={14} className="text-[#2F8F6B]" /> : <Copy size={14} />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="-mr-1.5 rounded-sm p-1.5 text-[#5B6472] hover:text-[#151A24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6772E]"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                            {kind === 'search' ? (
                                <SearchView model={searchModel} message={result?.message} reduce={reduce} />
                            ) : (
                                <StatusView model={statusModel} content={content} reduce={reduce} />
                            )}
                            <div className="pointer-events-none sticky bottom-0 -mb-6 h-6 bg-gradient-to-t from-white to-transparent" />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}