import { Outlet } from "react-router-dom";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import Header from "./Header";
import Sidebar from "./SideBar";
import Footer from "./Footer";
import { callApiWithToken } from "../../api/callApi";
import ChatBox from "../../ChatBox";

// Decorative backdrop: soft colour washes + a dot grid that fades out toward
// the bottom. It lives outside the scroll area, so it stays put while pages scroll.
const Backdrop = () => (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[#F6F7F5]">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#0F5257]/[0.09] blur-3xl" />
        <div className="absolute -right-24 top-1/4 h-[24rem] w-[24rem] rounded-full bg-indigo-400/[0.10] blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[22rem] w-[22rem] rounded-full bg-emerald-300/[0.10] blur-3xl" />
        <div
            className="absolute inset-0 [background-image:radial-gradient(rgba(11,51,53,0.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
    </div>
);

const MainLayout = () => {
    const [chatOpen, setChatOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

    return (
        // App shell: the window never scrolls. Header and footer stay put and
        // only <main> scrolls, so the footer is always visible at the bottom.
        <div className="flex h-[100dvh] flex-col overflow-hidden">
            <div className="shrink-0">
                <Header onMenuClick={() => setMobileNavOpen(true)} />
            </div>

            <div className="flex min-h-0 flex-1">
                <Sidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />

                {/* Positioning context for the backdrop, launcher and chat panel.
                    They are siblings of <main>, so they never scroll with the page
                    and can never sit on top of the footer. `isolate` keeps main's
                    z-10 from covering the sidebar's collapse toggle. */}
                <div className="relative isolate min-w-0 flex-1">
                    <Backdrop />

                    {/* pb-24 leaves room under the page content so table pagination
                        can be scrolled clear of the floating launcher. */}
                    <main className="relative z-10 h-full overflow-y-auto p-0">
                        <Outlet />
                    </main>

                    {/* Floating chat launcher */}
                    <motion.button
                        onClick={() => setChatOpen((v) => !v)}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        aria-label={chatOpen ? "Close AI support" : "Open AI support"}
                        aria-expanded={chatOpen}
                        className="absolute bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0F5257] to-[#0B3335] text-white shadow-lg shadow-[#0B3335]/30 ring-1 ring-white/20"
                    >
                        {!chatOpen && (
                            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#0F5257]/40 motion-reduce:hidden" />
                        )}
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={chatOpen ? "close" : "open"}
                                initial={{ opacity: 0, rotate: -45 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 45 }}
                                transition={{ duration: 0.15 }}
                            >
                                {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>

                    {/* Chat panel */}
                    <AnimatePresence>
                        {chatOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                                className="absolute bottom-[5.5rem] right-4 z-30 flex h-[28rem] max-h-[calc(100%-6.5rem)] w-[24rem] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-[#E4E2DD] bg-white shadow-2xl"
                            >
                                <div className="flex items-center justify-between bg-gradient-to-r from-[#0B3335] to-[#0F5257] px-4 py-3">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">AI Support</h2>
                                        <p className="text-[11px] text-[#9FC2C3]">Ask about any project or task</p>
                                    </div>
                                    <button
                                        onClick={() => setChatOpen(false)}
                                        aria-label="Close chat"
                                        className="rounded-full p-1 text-[#9FC2C3] transition hover:bg-white/10 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="min-h-0 flex-1">
                                    <ChatBox
                                        title="Support"
                                        onSendMessage={(prompt) =>
                                            callApiWithToken({
                                                url: `/agent/chat`,
                                                method: "POST",
                                                payload: { prompt },
                                            })
                                        }
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="shrink-0">
                <Footer />
            </div>
        </div>
    );
};

export default MainLayout;