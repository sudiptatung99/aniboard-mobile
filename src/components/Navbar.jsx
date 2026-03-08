export default function Navbar({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: "image",
      label: "Image",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      id: "data",
      label: "Data",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="sticky top-[69px] z-40 bg-white border-b border-[#e8e0ff] flex px-5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 relative font-['Sora'] text-[13px] font-semibold tracking-[0.2px] transition-colors duration-200 focus:outline-none ${
              isActive ? "text-[#6214fe]" : "text-[#a693c8]"
            }`}
          >
            {/* Icon */}
            <span
              className={`transition-transform duration-200 ${
                isActive ? "scale-110" : "scale-100"
              }`}
            >
              {tab.icon}
            </span>

            {/* Label */}
            {tab.label}

            {/* Active indicator bar */}
            <span
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-10 bg-[#6214fe] rounded-t-sm transition-all duration-300 ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
              style={{ transformOrigin: "center" }}
            />
          </button>
        );
      })}
    </nav>
  );
}
