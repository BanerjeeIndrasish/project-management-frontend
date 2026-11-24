import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick }) {
    const { logout, user, nameInitials } = useAuth();
    const currentUser = { name: user?.name, initials: nameInitials };
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#E4E2DD] bg-white/80 px-4 backdrop-blur-md sm:px-6">
            {/* Mobile: opens the sidebar drawer. Desktop: spacer (room for breadcrumbs later). */}
            <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1A1D1F] transition hover:bg-[#F0EFEB] md:hidden"
            >
                <Menu size={20} />
            </button>
            <div className="hidden md:block" />

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm transition hover:bg-[#F0EFEB]"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0F5257] to-[#0B3335] text-[12px] font-semibold text-white ring-2 ring-white">
                        {currentUser.initials}
                    </span>
                    <span className="hidden text-[#1A1D1F] sm:inline">{currentUser.name}</span>
                    <ChevronDown
                        size={15}
                        className={`text-[#6B7280] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                <AnimatePresence>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-3" onClick={() => setMenuOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl border border-[#E4E2DD] bg-white p-1 shadow-lg"
                            >
                                <div className="px-3 py-2">
                                    <p className="truncate text-sm font-medium text-[#1A1D1F]">{currentUser.name}</p>
                                    <p className="text-xs text-[#9AA0A6]">Signed in</p>
                                </div>
                                <div className="my-1 h-px bg-[#E4E2DD]" />
                                {/* <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1A1D1F] transition hover:bg-[#F5F5F3]"
                                >
                                    <UserIcon size={15} /> Profile
                                </button> */}
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#B3432B] transition hover:bg-[#B3432B]/5"
                                    onClick={logout}
                                >
                                    <LogOut size={15} /> Sign out
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}