'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, FileText, ListChecks, RotateCcw, Send, Sparkles } from 'lucide-react';
import { formatTime } from './utility/helper';
import ReportModal, { detectResultKind } from './components/UI/ProjectReport';

function makeId() {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const GENERIC_FALLBACK = 'I processed that, but have nothing more to add.';
const GENERIC_ERROR = 'Something went wrong on my end. Please try again.';

const isText = (v) => typeof v === 'string' && v.trim().length > 0;

function parseResponse(res) {
    const fallback = [{ content: GENERIC_FALLBACK, result: null }];
    if (!res || typeof res !== 'object') return fallback;

    if (res.mode === 'CONVERSATION') {
        return isText(res.answer) ? [{ content: res.answer, result: null }] : fallback;
    }

    if (res.mode === 'AUTOMATED_ACTION') {
        const results = Array.isArray(res.results) ? res.results : [];
        const messages = Array.isArray(res.messages) ? res.messages : [];
        const count = Math.max(results.length, messages.length);
        const items = [];

        for (let i = 0; i < count; i++) {
            const result = results[i] && typeof results[i] === 'object' ? results[i] : null;
            const text = [result?.message, messages[i]].find(isText);
            if (text) {
                items.push({ content: text, result });
            } else if (result && Array.isArray(result.tasks)) {
                items.push({ content: `Found ${result.tasks.length} matching task(s).`, result });
            }
        }
        return items.length > 0 ? items : fallback;
    }

    return fallback;
}

function getErrorText(err) {
    const raw = err?.response?.data?.message;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            const first = parsed?.error?.message?.split('.')?.[0];
            if (isText(first)) return first;
        } catch {
            if (raw.length < 160) return raw;
        }
    }
    return GENERIC_ERROR;
}

// Markdown symbols look noisy in a 4-line bubble preview.
function plainPreview(text) {
    return text.replace(/^#{1,6}\s*/gm, '').replace(/[*_`>]/g, '').trim();
}

function reportInfo(message) {
    if (message.role !== 'assistant' || message.isError) return null;
    const kind = detectResultKind(message.result);
    if (kind === 'status') return { kind, label: 'Open status report', Icon: FileText };
    if (kind === 'search') {
        const n = Array.isArray(message.result?.tasks) ? message.result.tasks.length : 0;
        if (n === 0) return null;
        return { kind, label: `View ${n} matching ${n === 1 ? 'task' : 'tasks'}`, Icon: ListChecks };
    }
    return null;
}

export default function ChatBox({
    onSendMessage,
    initialMessages = [],
    title = 'Assistant',
    subtitle = 'Usually replies in a moment',
    placeholder = 'Write a message…',
    className = '',
}) {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [lastFailedMessage, setLastFailedMessage] = useState(null);
    const [open, setOpen] = useState(false);
    const [activeMessage, setActiveMessage] = useState(null);

    const scrollRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isSending]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [input]);

    const dispatchMessage = useCallback(
        async (trimmed) => {
            if (!trimmed || isSending) return;

            const userMessage = { id: makeId(), role: 'user', content: trimmed, timestamp: new Date() };
            setMessages((prev) => [...prev, userMessage]);
            setError(null);
            setLastFailedMessage(null);
            setIsSending(true);

            try {
                const res = await onSendMessage?.(trimmed);
                const items = parseResponse(res);

                setMessages((prev) => [
                    ...prev,
                    ...items.map(({ content, result }) => ({
                        id: makeId(),
                        role: 'assistant',
                        content,
                        result,
                        timestamp: new Date(),
                    })),
                ]);
            } catch (err) {
                setMessages((prev) => [
                    ...prev,
                    { id: makeId(), role: 'assistant', content: getErrorText(err), isError: true, timestamp: new Date() },
                ]);
                setLastFailedMessage(trimmed);
                setError(true);
            } finally {
                setIsSending(false);
                textareaRef.current?.focus();
            }
        },
        [isSending, onSendMessage]
    );

    const sendMessage = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setInput('');
        dispatchMessage(trimmed);
    }, [input, dispatchMessage]);

    const retryLastMessage = () => {
        if (!lastFailedMessage) return;
        const toRetry = lastFailedMessage;
        setLastFailedMessage(null);
        setError(null);
        dispatchMessage(toRetry);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    const openReport = (message) => {
        setActiveMessage(message);
        setOpen(true);
    };

    // Keep activeMessage on close so the modal's exit animation still has content.
    const closeReport = useCallback(() => setOpen(false), []);

    const activeKind = detectResultKind(activeMessage?.result);
    const modalTitle =
        activeKind === 'search'
            ? 'Task search results'
            : `${activeMessage?.result?.projectName || 'Project'} — Status Update`;

    return (
        <div className={`flex h-full w-full flex-col overflow-hidden border border-[#E5E3DD] bg-[#FAFAF9] text-[#1A1A18] ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#E5E3DD] bg-white px-5 py-4">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6F5E] to-[#1F4D40] text-sm font-medium text-white shadow-sm">
                    {title.charAt(0).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#4FAE93]" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1A1A18]">{title}</p>
                    <p className="truncate text-xs text-[#6B6A66]">{subtitle}</p>
                </div>
                <Sparkles size={15} className="shrink-0 text-[#B7D8CE]" />
            </div>

            {/* Messages */}
            <div ref={scrollRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {messages.length === 0 && (
                    <div className="mt-10 flex flex-col items-center text-center">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF3F0] text-[#2F6F5E]">
                            <Sparkles size={18} />
                        </div>
                        <p className="text-sm text-[#8A8880]">Say something to start the conversation.</p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((message) => {
                        const isUser = message.role === 'user';
                        const isError = Boolean(message.isError);
                        const report = reportInfo(message);
                        const text = typeof message.content === 'string' && message.content.trim() ? message.content : GENERIC_ERROR;

                        const interactive = report
                            ? {
                                role: 'button',
                                tabIndex: 0,
                                onClick: () => openReport(message),
                                onKeyDown: (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        openReport(message);
                                    }
                                },
                            }
                            : {};

                        return (
                            <motion.div
                                key={message.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div
                                        {...interactive}
                                        className={
                                            isUser
                                                ? 'rounded-2xl rounded-br-sm bg-gradient-to-br from-[#2F6F5E] to-[#255A4C] px-4 py-2.5 text-sm text-white shadow-sm'
                                                : isError
                                                    ? 'flex items-start gap-2 rounded-2xl rounded-bl-sm border border-[#F3D9D2] bg-[#FDF3F1] px-4 py-2.5 text-sm text-[#B3402E]'
                                                    : `rounded-2xl rounded-bl-sm bg-[#F0EFEA] px-4 py-2.5 text-sm text-[#1A1A18] shadow-sm ${report
                                                        ? 'cursor-pointer transition-colors hover:bg-[#E8E7E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F5E]'
                                                        : ''
                                                    }`
                                        }
                                    >
                                        {isError && <AlertCircle size={15} className="mt-0.5 shrink-0" />}
                                        <div className="min-w-0">
                                            <p className={`whitespace-pre-wrap break-words ${report?.kind === 'status' ? 'line-clamp-4' : ''}`}>
                                                {report?.kind === 'status' ? plainPreview(text) : text}
                                            </p>
                                            {report && (
                                                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#2F6F5E]">
                                                    <report.Icon size={13} />
                                                    {report.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="mt-1 px-1 text-[11px] text-[#A5A39B]">{formatTime(message.timestamp)}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {isSending && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#F0EFEA] px-4 py-3">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A5A39B]" style={{ animationDelay: '-0.3s' }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A5A39B]" style={{ animationDelay: '-0.15s' }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A5A39B]" />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Error banner with retry — never shows raw error internals to the user */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between gap-3 border-t border-[#F3D9D2] bg-[#FDF3F1] px-5 py-2 text-xs text-[#B3402E]"
                    >
                        <span className="flex items-center gap-1.5">
                            <AlertCircle size={13} className="shrink-0" /> Couldn't get a response.
                        </span>
                        {lastFailedMessage && (
                            <button
                                type="button"
                                onClick={retryLastMessage}
                                className="flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 font-medium text-[#B3402E] ring-1 ring-[#F3D9D2] hover:bg-[#FDEDE9]"
                            >
                                <RotateCcw size={12} /> Retry
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-[#E5E3DD] bg-white p-3">
                <div className="flex items-end gap-2 rounded-xl border border-[#E5E3DD] bg-[#FAFAF9] px-3 py-2 transition-colors focus-within:border-[#2F6F5E] focus-within:ring-1 focus-within:ring-[#2F6F5E]">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={1}
                        aria-label="Message"
                        className="max-h-40 flex-1 resize-none bg-transparent text-sm text-[#1A1A18] placeholder:text-[#A5A39B] focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isSending}
                        aria-label="Send message"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2F6F5E] text-white transition-colors enabled:hover:bg-[#255A4C] disabled:cursor-not-allowed disabled:bg-[#D9D7CF] disabled:text-[#A5A39B]"
                    >
                        <Send size={15} />
                    </button>
                </div>
            </form>

            <ReportModal
                isOpen={open}
                onClose={closeReport}
                title={modalTitle}
                content={activeMessage?.content ?? ''}
                result={activeMessage?.result ?? null}
            />
        </div>
    );
}