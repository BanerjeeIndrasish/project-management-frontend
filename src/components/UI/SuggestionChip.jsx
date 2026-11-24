function SuggestionChip({ s, onPick, disabled }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#CFE3DC] bg-[#EAF3F0] px-3 py-1.5 text-xs font-medium text-[#2F6F5E] transition-colors hover:border-[#2F6F5E] hover:bg-[#DCEBE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F5E] disabled:cursor-not-allowed disabled:opacity-50"
        >
            <s.icon size={13} />
            {s.label}
        </button>
    );
}

export default SuggestionChip;