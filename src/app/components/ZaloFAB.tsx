const ZALO_LINK = 'https://zalo.me/0975563290';

export default function ZaloFAB() {
  return (
    <a
      href={ZALO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0068FF] text-white px-4 py-3 rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
      aria-label="Chat Zalo"
    >
      {/* Zalo icon SVG */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 2.09.598 4.04 1.636 5.68L2 22l4.453-1.61A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.5 13.5l-3-3 1.5-1.5 1.5 1.5 3.5-3.5 1.5 1.5-5 5z"/>
      </svg>
      <span className="text-sm font-semibold hidden sm:inline">Zalo ngay</span>
    </a>
  );
}
