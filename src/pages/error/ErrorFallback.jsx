import { useRouteError, isRouteErrorResponse, Link, useNavigate } from 'react-router';
import { useState } from 'react';

// Keep these in sync with the palette used across Header/Home/Projects/About
const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontMono = { fontFamily: "'IBM Plex Mono', monospace" };

const STATUS_COPY = {
    400: { title: 'Bad request', description: "The request couldn't be understood." },
    401: { title: 'Unauthorized', description: 'You need to sign in to view this page.' },
    403: { title: 'Forbidden', description: "You don't have access to this page." },
    404: { title: 'Page not found', description: "The page you're looking for doesn't exist or has moved." },
    500: { title: 'Server error', description: 'Something went wrong on our end.' },
};

export default function ErrorFallback() {
    const error = useRouteError();
    const navigate = useNavigate();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

    const isResponse = isRouteErrorResponse(error);
    const status = isResponse ? error.status : null;

    const copy =
        (status && STATUS_COPY[status]) || {
            title: isResponse ? 'Something went wrong' : 'Unexpected error',
            description: isResponse
                ? error.statusText || 'The server returned an unexpected response.'
                : "The page crashed while rendering. It's not you — try reloading.",
        };

    const errorMessage = isResponse ? error.data?.message || error.statusText : error?.message;
    const errorStack = !isResponse ? error?.stack : null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 bg-[#EEF0F3]">
            <div className="w-full max-w-lg py-16">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-2.5 h-2.5 bg-[#C6772E] shrink-0" />
                    <span className="text-xs text-[#5B6472]" style={fontMono}>
                        {isResponse ? `error / ${status ?? 'unknown'}` : 'error / runtime'}
                    </span>
                </div>

                {/* Headline */}
                <h1
                    className="text-4xl sm:text-5xl font-medium text-[#151A24] leading-tight mb-3"
                    style={fontDisplay}
                >
                    {status ?? 'Error'}
                </h1>
                <p className="text-lg font-medium text-[#151A24] mb-3">{copy.title}</p>
                <p className="text-[#5B6472] leading-relaxed mb-8 max-w-md">{copy.description}</p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-[#151A24] hover:bg-[#282F3D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6772E] focus-visible:ring-offset-2"
                    >
                        Reload page
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 text-sm font-medium text-[#151A24] border border-[#C9CFD8] hover:border-[#151A24] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6772E] focus-visible:ring-offset-2"
                    >
                        Go back
                    </button>
                    <Link
                        to="/home"
                        className="px-5 py-2.5 text-sm font-medium text-[#151A24] border border-[#C9CFD8] hover:border-[#151A24] transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6772E] focus-visible:ring-offset-2"
                    >
                        Back to home
                    </Link>
                </div>

                {/* Technical details — dev only */}
                {isDev && (errorMessage || errorStack) && (
                    <div className="border-t border-[#C9CFD8] pt-5">
                        <button
                            onClick={() => setDetailsOpen((v) => !v)}
                            className="text-xs text-[#5B6472] hover:text-[#151A24] transition-colors"
                            style={fontMono}
                        >
                            {detailsOpen ? '– hide technical details' : '+ show technical details'}
                        </button>
                        {detailsOpen && (
                            <pre
                                className="mt-3 p-4 bg-white border border-[#C9CFD8] text-xs text-[#5B6472] overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
                                style={fontMono}
                            >
                                {errorMessage}
                                {errorStack ? `\n\n${errorStack}` : ''}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}