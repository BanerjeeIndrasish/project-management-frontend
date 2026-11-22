import { useState, useRef, useEffect } from 'react';
import { Edit3, Trash2, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Keep these in sync with the palette used across the rest of the app
const MUTED = '#5B6472';
const SIGNAL = '#C6772E';
const DANGER = '#B3402F';

function IconTooltip({ label, children }) {
    const [visible, setVisible] = useState(false);
    return (
        <span
            className="relative inline-flex"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
        >
            {children}
            <AnimatePresence>
                {visible && (
                    <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.14 }}
                        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs text-white bg-[#151A24] rounded-sm z-20"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}

function EditButton({ onClick, label = 'Edit' }) {
    return (
        <IconTooltip label={label}>
            <motion.button
                type="button"
                onClick={onClick}
                aria-label={label}
                whileTap={{ scale: 0.88 }}
                whileHover="hover"
                initial="idle"
                className="relative flex items-center justify-center w-8 h-8 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6772E]"
            >
                <motion.span
                    variants={{ idle: { opacity: 0, scale: 0.6 }, hover: { opacity: 1, scale: 1 } }}
                    transition={{ duration: 0.16 }}
                    className="absolute inset-0 rounded-sm bg-[#C6772E]/10"
                />
                <motion.span
                    variants={{ idle: { rotate: 0, color: MUTED }, hover: { rotate: -8, color: SIGNAL } }}
                    transition={{ duration: 0.16 }}
                    className="relative z-10 flex items-center justify-center"
                >
                    <Edit3 size={16} />
                </motion.span>
            </motion.button>
        </IconTooltip>
    );
}

function DeleteButton({ onClick, label = 'Delete', confirmTimeout = 3000 }) {
    const [confirming, setConfirming] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const arm = () => {
        setConfirming(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setConfirming(false), confirmTimeout);
    };

    const cancel = () => {
        clearTimeout(timeoutRef.current);
        setConfirming(false);
    };

    const confirm = () => {
        clearTimeout(timeoutRef.current);
        setConfirming(false);
        onClick?.();
    };

    return (
        <div className="relative flex items-center">
            <AnimatePresence mode="wait" initial={false}>
                {!confirming ? (
                    <IconTooltip key="idle" label={label}>
                        <motion.button
                            type="button"
                            onClick={arm}
                            aria-label={label}
                            whileTap={{ scale: 0.88 }}
                            whileHover="hover"
                            initial="idle"
                            className="relative flex items-center justify-center w-8 h-8 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B3402F]"
                        >
                            <motion.span
                                variants={{ idle: { opacity: 0, scale: 0.6 }, hover: { opacity: 1, scale: 1 } }}
                                transition={{ duration: 0.16 }}
                                className="absolute inset-0 rounded-sm bg-[#B3402F]/10"
                            />
                            <motion.span
                                variants={{
                                    idle: { rotate: 0, color: MUTED },
                                    hover: { rotate: [0, -6, 6, -3, 0], color: DANGER },
                                }}
                                transition={{ duration: 0.35 }}
                                className="relative z-10 flex items-center justify-center"
                            >
                                <Trash2 size={16} />
                            </motion.span>
                        </motion.button>
                    </IconTooltip>
                ) : (
                    <motion.div
                        key="confirm"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-1 pl-2 pr-1 py-1 bg-white border border-[#C9CFD8] rounded-sm overflow-hidden"
                    >
                        <span className="text-xs text-[#5B6472] whitespace-nowrap mr-1">Delete?</span>
                        <button
                            type="button"
                            onClick={confirm}
                            aria-label="Confirm delete"
                            className="flex items-center justify-center w-6 h-6 rounded-sm text-white bg-[#B3402F] hover:bg-[#8F3324] transition-colors"
                        >
                            <Check size={13} />
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            aria-label="Cancel"
                            className="flex items-center justify-center w-6 h-6 rounded-sm text-[#5B6472] hover:text-[#151A24] hover:bg-[#EEF0F3] transition-colors"
                        >
                            <X size={13} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


export default function RowActions({ onEdit, onDelete }) {
    return (
        <div className="flex items-center gap-1">
            {onEdit && <EditButton onClick={onEdit} />}
            {onDelete && <DeleteButton onClick={onDelete} />}
        </div>
    );
}