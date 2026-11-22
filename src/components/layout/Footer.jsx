// Requires: lucide-react
import { Heart } from "lucide-react";

const links = [
    { label: "Support", href: "/support" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
];

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-[#E4E2DD] bg-white px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-1 text-center text-xs text-[#6B7280] sm:flex-row">
                <p className="flex items-center gap-1">
                    <span className="font-medium text-[#1A1D1F]">PMS</span>
                    <span aria-hidden>·</span>
                    <span>
                        Made with <Heart size={11} className="mx-0.5 inline-block fill-[#D98E3F] text-[#D98E3F]" /> by
                        Indrasish Banerjee
                    </span>
                    <span aria-hidden>·</span>
                    <span>{year}</span>
                </p>

                <nav className="flex items-center gap-4" aria-label="Footer">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-[#0F5257] hover:underline hover:underline-offset-4"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>
        </footer>
    );
};

export default Footer;