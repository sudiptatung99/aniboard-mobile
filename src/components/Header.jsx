import { useState, useRef, useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header({ user, onSignOut }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);
  const { Logout,userDetails } = UserAuth();
  const navigate = useNavigate()

  const LogoutUser = () => {
    navigate("/", { replace: true, state: {} });
    Logout();
  }
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e8e0ff] px-5 pt-4 pb-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2 font-['Sora'] font-extrabold text-[22px] tracking-tight text-[#6214fe]">
        <img src="/aniboard.png" alt="Aniboard Logo" className="h-6" />
      </div>

      {/* Profile + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6214fe] to-[#9059fd] flex items-center justify-center text-white font-['Sora'] font-bold text-[13px] transition-all duration-200 active:scale-90 focus:outline-none"
          aria-label="Profile menu"
          aria-expanded={dropdownOpen}
        >
         {userDetails?.Email?.charAt(0)?.toUpperCase()}
        </button>

        {/* Dropdown */}
        <div
          className={`absolute right-0 top-[calc(100%+10px)] w-52 bg-white rounded-2xl shadow-[0_16px_48px_rgba(98,20,254,0.18)] border border-[#e8e0ff] overflow-hidden transition-all duration-200 origin-top-right ${dropdownOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none"
            }`}
        >
          {/* User info */}
          <div className="px-4 py-3 bg-[#efeaf9] border-b border-[#e8e0ff]">
            <p className="font-['Sora'] font-semibold text-[13px] text-[#1a0a3c]">
              {userDetails?.Email}
            </p>
            {/* <p className="text-[11px] text-[#a693c8] mt-0.5">
              {user?.email || "user@aniboard.io"}
            </p> */}
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {/* <DropdownItem icon={<ProfileIcon />} label="My Profile" />
            <DropdownItem icon={<SettingsIcon />} label="Settings" />
            <div className="mx-3 my-1.5 h-px bg-[#e8e0ff]" /> */}
            <button
              onClick={LogoutUser}
              className="flex items-center w-full gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-red-50 active:bg-red-100 group"
            >
              <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 transition-colors duration-150 rounded-xl bg-red-50 group-hover:bg-red-100">
                <SignOutIcon />
              </span>
              <span className="font-['Sora'] font-semibold text-[13px] text-red-500">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DropdownItem({ icon, label }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[#efeaf9] active:bg-[#dccbff] group">
      <span className="w-8 h-8 rounded-xl bg-[#efeaf9] flex items-center justify-center text-[#6214fe] group-hover:bg-[#dccbff] transition-colors duration-150 flex-shrink-0">
        {icon}
      </span>
      <span className="font-['Sora'] font-semibold text-[13px] text-[#1a0a3c]">
        {label}
      </span>
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
