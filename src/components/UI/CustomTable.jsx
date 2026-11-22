import { useMemo, useState } from "react";
import {
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";

const ALIGN_TEXT = { left: "text-left", center: "text-center", right: "text-right" };
const ALIGN_FLEX = { left: "justify-start", center: "justify-center", right: "justify-end" };

const getNestedValue = (obj, path) =>
    path?.split(".").reduce((acc, part) => acc?.[part], obj);

export default function CustomTable({
    data = [],
    columns = [],
    pageSize = 10,
    toolbar = null,
    className = "",
    loading = false,
    emptyMessage = "No records found.",
    maxHeight,
    rowKey,
    // Columns hidden on the mobile card layout (e.g. a `field` you only need for wide screens).
    // Everything else still renders as a label/value row on small screens.
    cardHiddenFields = [],
}) {
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState(null);

    // Fix: previously `col.sticky` was applied per-<th>, which does nothing —
    // a sticky header only works when the whole header row is positioned.
    const stickyHeader = columns.some((col) => col.sticky);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        const { key, direction } = sortConfig;

        return [...data].sort((a, b) => {
            const valA = getNestedValue(a, key);
            const valB = getNestedValue(b, key);

            // Fix: original comparator broke on null/undefined values
            if (valA == null && valB == null) return 0;
            if (valA == null) return 1;
            if (valB == null) return -1;

            if (typeof valA === "number" && typeof valB === "number") {
                return direction === "asc" ? valA - valB : valB - valA;
            }

            const comparison = String(valA).localeCompare(String(valB), undefined, {
                numeric: true,
                sensitivity: "base",
            });
            return direction === "asc" ? comparison : -comparison;
        });
    }, [data, sortConfig]);

    // Fix: clamp instead of stranding the user on a page that no longer
    // exists after filtering/sorting shrinks the result set.
    const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
    const currentPage = Math.min(page, totalPages);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const handleSort = (key) => {
        if (!key) return;
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
        setPage(1);
    };

    const rangeStart = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, sortedData.length);

    const SortIcon = ({ col }) => {
        if (!col.sortingKey) return null;
        const isActive = sortConfig?.key === col.sortingKey;
        if (!isActive) return <ArrowUpDown size={13} className="shrink-0 text-[#C7C5BF]" />;
        return sortConfig.direction === "asc" ? (
            <ArrowUp size={13} className="shrink-0 text-[#0F5257]" />
        ) : (
            <ArrowDown size={13} className="shrink-0 text-[#0F5257]" />
        );
    };

    const keyFor = (row, idx) => (rowKey ? rowKey(row) : row.id ?? idx);

    return (
        <div className="w-full">
            {toolbar && <div className="mb-4">{toolbar}</div>}

            <div className={`overflow-hidden rounded-lg border border-[#E4E2DD] bg-white ${className}`}>
                {/* ---------- Desktop / tablet: real table, scrolls horizontally only if it must ---------- */}
                <div
                    className="hidden overflow-x-auto sm:block"
                    style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
                >
                    <table className="w-full min-w-full border-collapse text-sm">
                        <thead>
                            <tr
                                className={`border-b border-[#E4E2DD] bg-[#FAFAF9] ${stickyHeader ? "sticky top-0 z-10" : ""
                                    }`}
                            >
                                {columns.map((col, idx) => {
                                    const isSortable = Boolean(col.sortingKey);
                                    const align = col.align || "left";

                                    return (
                                        <th
                                            key={col.field || idx}
                                            scope="col"
                                            className={`select-none whitespace-nowrap px-3 py-3 font-medium text-[#6B7280] sm:px-4 ${ALIGN_TEXT[align]
                                                } ${isSortable ? "cursor-pointer hover:text-[#1A1D1F]" : ""}`}
                                            style={{ width: col.width || "auto" }}
                                            onClick={() => isSortable && handleSort(col.sortingKey)}
                                        >
                                            <span className={`inline-flex w-full items-center gap-1 ${ALIGN_FLEX[align]}`}>
                                                {col.header}
                                                <SortIcon col={col} />
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-[#6B7280]">
                                        <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                                        Loading…
                                    </td>
                                </tr>
                            )}

                            {!loading && paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-[#6B7280]">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                paginatedData.map((row, rowIdx) => (
                                    <tr
                                        key={keyFor(row, rowIdx)}
                                        className="border-b border-[#E4E2DD] last:border-0 hover:bg-[#FAFAF9]"
                                    >
                                        {columns.map((col, colIdx) => (
                                            <td
                                                key={col.field || colIdx}
                                                className={`px-3 py-3 text-[#1A1D1F] sm:px-4 ${ALIGN_TEXT[col.align || "left"]}`}
                                            >
                                                {col.render ? col.render(row) : row[col.field]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* ---------- Mobile: one card per row, no horizontal scrolling ---------- */}
                <div
                    className="divide-y divide-[#E4E2DD] sm:hidden"
                    style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
                >
                    {loading && (
                        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-[#6B7280]">
                            <Loader2 size={18} className="animate-spin" />
                            Loading…
                        </div>
                    )}

                    {!loading && paginatedData.length === 0 && (
                        <div className="px-4 py-10 text-center text-[#6B7280]">{emptyMessage}</div>
                    )}

                    {!loading &&
                        paginatedData.map((row, rowIdx) => {
                            const visibleCols = columns.filter((col) => !cardHiddenFields.includes(col.field));
                            const titleCol = visibleCols[0];
                            const restCols = visibleCols.slice(1);

                            return (
                                <div key={keyFor(row, rowIdx)} className="px-4 py-3 active:bg-[#FAFAF9]">
                                    {titleCol && (
                                        <div className="mb-2 font-medium text-[#1A1D1F]">
                                            {titleCol.render ? titleCol.render(row) : row[titleCol.field]}
                                        </div>
                                    )}
                                    <dl className="space-y-1.5">
                                        {restCols.map((col, colIdx) => (
                                            <div
                                                key={col.field || colIdx}
                                                className="flex items-start justify-between gap-3 text-sm"
                                            >
                                                <dt className="shrink-0 text-[#6B7280]">{col.header}</dt>
                                                <dd className="text-right text-[#1A1D1F]">
                                                    {col.render ? col.render(row) : row[col.field]}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            );
                        })}
                </div>

                {/* ---------- Footer: stacks on mobile, one row on larger screens ---------- */}
                <div className="flex flex-col gap-3 border-t border-[#E4E2DD] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <span className="text-xs text-[#6B7280]">
                        {sortedData.length === 0
                            ? "0 results"
                            : `Showing ${rangeStart}–${rangeEnd} of ${sortedData.length}`}
                    </span>

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <button
                            type="button"
                            className="flex items-center gap-1 rounded-md border border-[#E4E2DD] px-2.5 py-1.5 text-sm text-[#4B5058] hover:bg-[#F0EFEB] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            disabled={currentPage === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={15} />
                            <span className="hidden xs:inline">Prev</span>
                        </button>
                        <span className="px-1 text-sm text-[#4B5058]">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            className="flex items-center gap-1 rounded-md border border-[#E4E2DD] px-2.5 py-1.5 text-sm text-[#4B5058] hover:bg-[#F0EFEB] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            <span className="hidden xs:inline">Next</span>
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}