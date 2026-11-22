import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { formatDateTime } from "../../utility/helper";

const TimeDisplay = ({ isoTring }) => {
    const time = formatDateTime(isoTring);
    const isValid = Boolean(time);

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            whileHover={{ y: -1.5 }}
            title={isValid ? time : "Invalid date"}
            className={`group relative inline-flex w-fit max-w-full items-center gap-2 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-1.5 backdrop-blur-md transition-all duration-200 ${isValid
                    ? "border-indigo-100 bg-indigo-50/60 shadow-[0_1px_3px_rgba(79,70,229,0.08)] hover:border-indigo-200 hover:bg-indigo-50/90 hover:shadow-[0_8px_20px_-8px_rgba(99,102,241,0.45)]"
                    : "border-slate-200 bg-slate-50/70"
                }`}
        >
            {/* Glass sheen — a soft highlight across the top half, the detail that
                actually reads as "glass" rather than just a translucent box. */}
            <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent"
                aria-hidden
            />

            <span
                className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm ${isValid ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-slate-300"
                    }`}
            >
                <Clock size={11} className="text-white" />
            </span>

            <span
                className={`relative z-10 truncate text-[11px] font-semibold tracking-wide tabular-nums ${isValid ? "text-indigo-900" : "text-slate-400"
                    }`}
            >
                {isValid ? time : "Invalid date"}
            </span>
        </motion.div>
    );
};

export default TimeDisplay;