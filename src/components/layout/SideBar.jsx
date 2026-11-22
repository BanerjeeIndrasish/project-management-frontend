// Requires: react-router-dom, lucide-react, framer-motion
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Users, FolderKanban, ListChecks, Clock, X, Home, ChevronLeft, Sparkles, UserGroup } from "lucide-react";

const menus = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Users", path: "/users", icon: Users },
    { label: "Projects", path: "/projects", icon: FolderKanban },
    { label: "Tasks", path: "/tasks", icon: ListChecks },
    { label: "Timelogs", path: "/timelogs", icon: Clock },
];

// Soft, slow-drifting glow blobs behind the glass — pure decoration,
// clipped by the aside's own overflow-hidden so they never leak into layout.
function AmbientGlow() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <motion.div
                className="absolute -left-16 -top-10 h-56 w-56 rounded-full bg-[#0F5257]/40 blur-3xl"
                animate={{ y: [0, 16, 0], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -right-14 top-1/2 h-48 w-48 rounded-full bg-[#D98E3F]/20 blur-3xl"
                animate={{ y: [0, -14, 0], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
        </div>
    );
}

function NavItems({ collapsed, onNavigate }) {
    return (
        <motion.nav
            className="flex flex-col gap-1 px-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
            {menus.map((menu) => {
                const Icon = menu.icon;
                return (
                    <motion.div
                        key={menu.path}
                        variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                    >
                        <NavLink to={menu.path} onClick={onNavigate} className="relative block">
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="sidebar-active-pill"
                                            transition={{ type: "spring", stiffness: 480, damping: 38 }}
                                            className="absolute inset-0 rounded-xl bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_16px_-4px_rgba(15,82,87,0.6)] backdrop-blur-sm"
                                        />
                                    )}
                                    <span
                                        title={collapsed ? menu.label : undefined}
                                        className={`relative z-10 flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${collapsed ? "justify-center" : ""
                                            } ${isActive
                                                ? "text-white"
                                                : "text-[#8FB0B1] hover:translate-x-0.5 hover:border-[#0F5257]/50 hover:bg-white/[0.04] hover:text-white hover:shadow-[0_0_12px_-2px_rgba(15,82,87,0.5)]"
                                            }`}
                                    >
                                        <motion.span whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.94 }} className="shrink-0">
                                            <Icon size={17} className={isActive ? "drop-shadow-[0_0_6px_rgba(217,142,63,0.5)]" : ""} />
                                        </motion.span>
                                        <AnimatePresence initial={false}>
                                            {!collapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: "auto" }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="overflow-hidden whitespace-nowrap"
                                                >
                                                    {menu.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {isActive && !collapsed && (
                                            <motion.span
                                                layoutId="sidebar-active-dot"
                                                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#D98E3F] shadow-[0_0_6px_rgba(217,142,63,0.8)]"
                                            />
                                        )}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                );
            })}
        </motion.nav>
    );
}

function SidebarBody({ collapsed, onNavigate }) {
    return (
        <>
            <div className={`flex items-center gap-2.5 px-5 pb-6 pt-6 ${collapsed ? "justify-center px-0" : ""}`}>
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#0F5257]/40 to-transparent" />
                    <UserGroup color='#ffffff' size={18} />
                </div>
                <AnimatePresence initial={false}>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap text-[16px] font-semibold tracking-tight text-white"
                        >
                            PMS
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <NavItems collapsed={collapsed} onNavigate={onNavigate} />

            <div className="mt-auto px-3 pb-5 pt-6">
                <div
                    className={`rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-sm ${collapsed ? "flex justify-center px-0" : ""
                        }`}
                >
                    {collapsed ? (
                        <Sparkles size={16} className="text-[#D98E3F]" />
                    ) : (
                        <div className="flex items-start gap-2">
                            <Sparkles size={15} className="mt-0.5 shrink-0 text-[#D98E3F]" />
                            <div>
                                <p className="text-xs font-medium text-[#DCEEEE]">Need help?</p>
                                <p className="mt-0.5 text-[11px] leading-snug text-[#7FA5A6]">
                                    Ask the assistant in the corner.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// The mobile drawer is controlled by the parent: the hamburger lives in the
// Header (a fixed button here sat underneath the sticky header).
const Sidebar = ({ mobileOpen = false, onMobileClose = () => { } }) => {
    const [collapsed, setCollapsed] = useState(false);

    // Escape closes the drawer.
    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e) => e.key === "Escape" && onMobileClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [mobileOpen, onMobileClose]);

    return (
        <>
            {/* Desktop rail. Height comes from the layout's flex row (h-full), not
                100vh, so it never runs under the footer. `relative` anchors the glow
                and the collapse toggle. */}
            <motion.aside
                animate={{ width: collapsed ? 76 : 240 }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="relative z-10 hidden h-full shrink-0 flex-col border-r border-white/5 bg-[#0A2224]/95 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl md:flex"
            >
                <div className="absolute inset-0 overflow-hidden">
                    <AmbientGlow />
                </div>
                <div className="relative z-10 flex h-full flex-col overflow-y-auto">
                    <SidebarBody collapsed={collapsed} />
                </div>

                {/* Collapse toggle — floats on the rail's edge */}
                <motion.button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    className="absolute -right-3 top-8 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white text-[#0F5257] shadow-md ring-1 ring-black/5 transition-colors duration-200 hover:bg-[#0F5257] hover:text-white hover:shadow-lg hover:shadow-[#0F5257]/30"
                >
                    <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronLeft size={13} />
                    </motion.span>
                </motion.button>
            </motion.aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <div className="fixed inset-0 z-40 md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={onMobileClose}
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 340, damping: 34 }}
                            className="relative flex h-full w-72 flex-col overflow-hidden bg-[#0A2224]/98 shadow-2xl backdrop-blur-xl"
                        >
                            <AmbientGlow />
                            <div className="relative z-10 flex h-full flex-col overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={onMobileClose}
                                    className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#9FC2C3] hover:bg-white/10 hover:text-white"
                                    aria-label="Close menu"
                                >
                                    <X size={18} />
                                </button>
                                <SidebarBody collapsed={false} onNavigate={onMobileClose} />
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;