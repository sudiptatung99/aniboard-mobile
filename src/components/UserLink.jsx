import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PrivateAxios } from "../api/AxisoInstance";
import { UserAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 10;

// Plan Badge Component
function TypeBadge({ type }) {
  const styles = {
    Pro: { bg: "bg-[#ede9fe]", text: "text-[#6214fe]", border: "border-[#ddd6fe]" },
    Enterprise: { bg: "bg-[#fef3c7]", text: "text-[#b45309]", border: "border-[#fde68a]" },
    Free: { bg: "bg-[#f1f5f9]", text: "text-[#64748b]", border: "border-[#e2e8f0]" },
  };
  const s = styles[type] || styles.Free;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border tracking-wide uppercase ${s.bg} ${s.text} ${s.border}`}
    >
      {type || "Free"}
    </span>
  );
}

// Active/Inactive Live Heartbeat Status Badge
function StatusBadge({ active, label }) {
  const isActive = active === true ;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 ${
        isActive
          ? "bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]"
          : "bg-[#fee2e2] text-[#dc2626] border-[#fecaca]"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? "bg-[#16a34a] animate-pulse" : "bg-[#dc2626]"
        }`}
      />
      {label || (isActive ? "Active" : "Inactive")}
    </span>
  );
}

// Helper to check if a board is live/active by heartbeat
export const isBoardActive = (b) => {
  if (!b) return false;
  return (
    b.HeartbeatIsActive === true ||
    b.HeartbeatIsActive === 1 ||
    String(b.HeartbeatIsActive).toLowerCase() === "true"
  );
};

// Expandable Board List for Mobile Cards
function MobileBoardList({ boards = [], statusFilter = "all" }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [statusFilter]);

  const displayBoards = useMemo(() => {
    if (!boards || boards.length === 0) return [];
    if (statusFilter === "active") {
      return boards.filter((b) => isBoardActive(b));
    }
    if (statusFilter === "inactive") {
      return boards.filter((b) => !isBoardActive(b));
    }
    return [...boards].sort((a, b) => {
      const aAct = isBoardActive(a) ? 1 : 0;
      const bAct = isBoardActive(b) ? 1 : 0;
      return bAct - aAct;
    });
  }, [boards, statusFilter]);

  if (!displayBoards || displayBoards.length === 0) {
    const msg =
      statusFilter === "active"
        ? "No active boards"
        : statusFilter === "inactive"
        ? "No inactive boards"
        : "No boards found";
    return (
      <div className="py-2.5 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#e8e0ff]">
        <p className="text-[12px] text-[#9ca3af] italic">{msg}</p>
      </div>
    );
  }

  const preview = expanded ? displayBoards : displayBoards.slice(0, 2);

  return (
    <div className="space-y-1.5 w-full">
      {preview.map((b, i) => (
        <div
          key={b.DesignBoardId || i}
          className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-[#faf8ff] border border-[#f0ebff] hover:border-[#dfd3ff] transition-colors"
        >
          <div className="flex items-center min-w-0 gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#efeaf9] text-[#6214fe] flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <span className="text-[12.5px] font-semibold text-[#1a0a3c] truncate">
              {b.DesignBoardName || "Untitled Board"}
            </span>
          </div>
          <StatusBadge active={isBoardActive(b)} />
        </div>
      ))}

      {displayBoards.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 flex items-center justify-center gap-1 text-[11.5px] font-bold text-[#6214fe] hover:text-[#4613ae] bg-[#f9f6ff] hover:bg-[#efeaf9] rounded-xl border border-[#ede7fc] transition-all active:scale-[0.98]"
        >
          {expanded ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Show Less
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              +{displayBoards.length - 2} More Boards
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Table Board List Cell
function TableBoardListCell({ boards = [], statusFilter = "all" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [statusFilter]);

  const displayBoards = useMemo(() => {
    if (!boards || boards.length === 0) return [];
    if (statusFilter === "active") {
      return boards.filter((b) => isBoardActive(b));
    }
    if (statusFilter === "inactive") {
      return boards.filter((b) => !isBoardActive(b));
    }
    return [...boards].sort((a, b) => {
      const aAct = isBoardActive(a) ? 1 : 0;
      const bAct = isBoardActive(b) ? 1 : 0;
      return bAct - aAct;
    });
  }, [boards, statusFilter]);

  if (!displayBoards || displayBoards.length === 0) {
    return <span className="text-[#cbd5e1] text-[12px]">—</span>;
  }
  const preview = displayBoards.slice(0, open ? displayBoards.length : 2);

  return (
    <div className="min-w-[170px] space-y-1">
      {preview.map((b, i) => (
        <div
          key={b.DesignBoardId || i}
          className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-[#faf8ff] border border-[#f0ebff]"
        >
          <span className="text-[12px] text-[#334155] font-semibold truncate max-w-[110px]" title={b.DesignBoardName}>
            {b.DesignBoardName}
          </span>
          <StatusBadge active={isBoardActive(b)} />
        </div>
      ))}
      {displayBoards.length > 2 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-[#6214fe] text-[11px] font-bold flex items-center gap-1 hover:underline pt-0.5"
        >
          {open ? "Show Less" : `+${displayBoards.length - 2} more`}
        </button>
      )}
    </div>
  );
}

export default function UserLink() {
  const { userDetails } = UserAuth();
  const navigate = useNavigate();

  const [allInvoices, setAllInvoices] = useState([]);
  const [totalStatsInvoices, setTotalStatsInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const [toast, setToast] = useState({ show: false, msg: "" });

  const isAniboardAdmin = useMemo(() => {
    const email = (userDetails?.Email || userDetails?.email || "")?.toLowerCase();
    return email === "info@aniboard.com";
  }, [userDetails]);

  // Restrict access if not admin
  useEffect(() => {
    if (userDetails && Object.keys(userDetails).length > 0 && !isAniboardAdmin) {
      navigate("/imagelist", { replace: true });
    }
  }, [isAniboardAdmin, userDetails, navigate]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };

  // Fetch Data from Backend
  const fetchData = async (targetStatus = statusFilter, targetSearch = searchQuery) => {
    setLoading(true);
    try {
      const heartbeatParam = targetStatus === "all" ? "" : targetStatus;
      const response = await PrivateAxios.post(
        "DesignBoard/GetCompanyAnalyticsDetail",
        {
          PageNo: 1,
          PageSize: 1000,
          SearchText: targetSearch || "",
          HeartbeatStatus: heartbeatParam,
        }
      );

      if (response?.status === 200 && Array.isArray(response?.data)) {
        setAllInvoices(response.data);
        if (targetStatus === "all" || totalStatsInvoices.length === 0) {
          setTotalStatsInvoices(response.data);
        }
      } else {
        setAllInvoices([]);
      }
    } catch (err) {
      console.error("Error fetching user links:", err);
      showToast("Failed to load user links");
      setAllInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (isAniboardAdmin) {
      fetchData(statusFilter, searchQuery);
    }
  }, [isAniboardAdmin]);

  // Dynamic filter stats counts calculated from full dataset
  const counts = useMemo(() => {
    let all = 0;
    let active = 0;
    let inactive = 0;

    const source = totalStatsInvoices.length > 0 ? totalStatsInvoices : allInvoices;

    source.forEach((inv) => {
      const boards = inv?.BoardLists || [];
      if (!boards || boards.length === 0) return;
      all++;

      const hasActive = boards.some((b) => isBoardActive(b));
      const hasInactive = boards.some((b) => !isBoardActive(b));

      if (hasActive) {
        active++;
      }
      if (hasInactive) {
        inactive++;
      }
    });

    return { all, active, inactive };
  }, [allInvoices, totalStatsInvoices]);

  // Filtered records
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      const boards = inv?.BoardLists || [];

      // When filtering by Active, only show users who actually have active boards
      if (statusFilter === "active") {
        if (!boards || boards.length === 0) return false;
        const hasActive = boards.some((b) => isBoardActive(b));
        if (!hasActive) return false;
      }

      // When filtering by Inactive, only show users who have inactive boards
      if (statusFilter === "inactive") {
        if (!boards || boards.length === 0) return false;
        const hasInactive = boards.some((b) => !isBoardActive(b));
        if (!hasInactive) return false;
      }

      // When filtering by All, hide users who have zero boards
      if (statusFilter === "all") {
        if (!boards || boards.length === 0) return false;
      }

      // Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const emailMatch = (inv?.Email || "").toLowerCase().includes(query);
        const companyIdMatch = String(inv?.CompanyUniqueId || "").includes(query);
        const nameMatch = (inv?.CustomerName || inv?.CompanyName || "").toLowerCase().includes(query);
        const boardMatch = boards.some((b) =>
          (b?.DesignBoardName || "").toLowerCase().includes(query)
        );
        return emailMatch || companyIdMatch || nameMatch || boardMatch;
      }

      return true;
    });
  }, [allInvoices, statusFilter, searchQuery]);

  const totalData = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalData / ITEMS_PER_PAGE));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData(statusFilter, "");
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchData(status, searchQuery);
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col w-full max-w-2xl gap-3 p-3 mx-auto sm:p-5 font-['DM_Sans'] pb-28">
      {/* Top Header Section */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Sora'] text-[19px] sm:text-[21px] font-extrabold text-[#1a0a3c] tracking-tight">
              User Links
            </h1>
            <span className="bg-[#efeaf9] text-[#6214fe] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#e0d4ff]">
              {totalData} records
            </span>
          </div>
          <p className="text-[12px] text-[#7e6aaf] mt-0.5">
            BrightSign screens & heartbeat monitoring
          </p>
        </div>

        {/* View Switcher & Reload */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#e8e0ff] shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Card View (Mobile Optimized)"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-[#6214fe] text-white shadow-sm"
                  : "text-[#7e6aaf] hover:bg-[#faf8ff]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-[#6214fe] text-white shadow-sm"
                  : "text-[#7e6aaf] hover:bg-[#faf8ff]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchData(statusFilter, searchQuery)}
            title="Refresh Data"
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-white border border-[#e8e0ff] text-[#6214fe] flex items-center justify-center hover:bg-[#faf8ff] active:scale-90 transition-all shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="flex flex-col gap-2 pt-1">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#a693c8]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search email, company ID, name..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-[12.5px] border border-[#e8e0ff] bg-white placeholder-[#a693c8] text-[#1a0a3c] focus:outline-none focus:border-[#6214fe] focus:ring-2 focus:ring-[#6214fe]/15 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a693c8] hover:text-[#6214fe]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "All", count: counts.all },
            { id: "active", label: "Active", count: counts.active },
            { id: "inactive", label: "Inactive", count: counts.inactive },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleStatusChange(item.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[12px] font-semibold transition-all duration-150 active:scale-95 focus:outline-none ${
                statusFilter === item.id
                  ? "bg-[#6214fe] text-white shadow-[0_4px_12px_rgba(98,20,254,0.3)] font-bold"
                  : "bg-white border border-[#e8e0ff] text-[#6214fe] hover:bg-[#faf8ff]"
              }`}
            >
              <span>{item.label}</span>
              {/* <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === item.id
                    ? "bg-white/20 text-white"
                    : "bg-[#efeaf9] text-[#6214fe]"
                }`}
              >
                {item.count}
              </span> */}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-4 border border-[#e8e0ff] animate-pulse space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#efeaf9]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-40 bg-[#efeaf9] rounded-md" />
                  <div className="h-3 w-24 bg-[#f3efff] rounded-md" />
                </div>
              </div>
              <div className="h-10 w-full bg-[#faf8ff] rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && paginatedInvoices.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#e8e0ff] text-center shadow-sm my-4">
          <div className="w-12 h-12 rounded-full bg-[#f6f2ff] text-[#6214fe] flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="font-['Sora'] font-bold text-[15px] text-[#1a0a3c] mb-1">
            No Records Found
          </h3>
          <p className="text-[12.5px] text-[#7e6aaf] max-w-xs mx-auto mb-4">
            We couldn't find any user links matching your search or status filter.
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="px-4 py-2 bg-[#efeaf9] text-[#6214fe] text-[12px] font-bold rounded-xl hover:bg-[#e2d5fa] active:scale-95 transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* CARD VIEW (MOBILE OPTIMIZED) */}
      {!loading && paginatedInvoices.length > 0 && viewMode === "cards" && (
        <div className="space-y-3.5">
          {paginatedInvoices.map((inv, index) => {
            const companyUniqueId = inv?.CompanyUniqueId;
            const email = inv?.Email || "";
            const customerType = inv?.CustomerType;
            const boardLists = inv?.BoardLists || [];
            const initial = email ? email.charAt(0).toUpperCase() : "#";
            const activeBoardsCount = boardLists.filter((b) => isBoardActive(b)).length;
            const inactiveBoardsCount = boardLists.filter((b) => !isBoardActive(b)).length;
            const totalBoards = boardLists.length;

            return (
              <div
                key={inv?.CustomerId || companyUniqueId || index}
                className="bg-white rounded-2xl p-4 border border-[#e8e0ff] shadow-[0_2px_10px_rgba(98,20,254,0.06)] hover:border-[#cfbbfb] transition-all space-y-3"
              >
                {/* Header Row: User Avatar + Email + Subtitle */}
                <div className="flex items-center gap-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6214fe] to-[#9059fd] flex items-center justify-center text-white font-['Sora'] font-bold text-[15px] flex-shrink-0 shadow-[0_2px_6px_rgba(98,20,254,0.25)]">
                    {initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-['Sora'] font-bold text-[13.5px] text-[#1a0a3c] truncate leading-snug">
                      {email || "No email available"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-['Sora'] font-bold text-[11px] text-[#6214fe] bg-[#efeaf9] px-2 py-0.5 rounded-md border border-[#e0d4ff]">
                        #{companyUniqueId || "N/A"}
                      </span>
                      <TypeBadge type={customerType} />
                      {(inv?.CompanyName || inv?.CustomerName) && (
                        <span className="text-[11px] text-[#8a7ba8] truncate max-w-[150px]">
                          • {inv?.CompanyName || inv?.CustomerName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boards List Section */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#a693c8]">
                      {statusFilter === "active"
                        ? `Active Boards (${activeBoardsCount})`
                        : statusFilter === "inactive"
                        ? `Inactive Boards (${inactiveBoardsCount})`
                        : `Assigned Boards (${totalBoards})`}
                    </span>

                    <span className="text-[11px] font-bold text-[#6214fe] bg-[#f8f6ff] px-2 py-0.5 rounded-md border border-[#eee7ff]">
                      {statusFilter === "active" ? (
                        <span className="text-[#16a34a] font-bold">
                          {activeBoardsCount} {activeBoardsCount === 1 ? "Active Board" : "Active Boards"}
                        </span>
                      ) : statusFilter === "inactive" ? (
                        <span className="text-[#dc2626] font-bold">
                          {inactiveBoardsCount} {inactiveBoardsCount === 1 ? "Inactive Board" : "Inactive Boards"}
                        </span>
                      ) : (
                        <>
                          {totalBoards} {totalBoards === 1 ? "Board" : "Boards"}
                          {activeBoardsCount > 0 ? ` • ${activeBoardsCount} Active` : ""}
                        </>
                      )}
                    </span>
                  </div>

                  <MobileBoardList
                    boards={boardLists}
                    statusFilter={statusFilter}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW (RESPONSIVE HORIZONTAL SCROLL) */}
      {!loading && paginatedInvoices.length > 0 && viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-[#e8e0ff] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f8f6ff] border-b border-[#e8e0ff]">
                  <th className="py-3 px-3.5 font-bold text-[11px] text-[#7e6aaf] uppercase tracking-wider">
                    #ID
                  </th>
                  <th className="py-3 px-3.5 font-bold text-[11px] text-[#7e6aaf] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-3 px-3.5 font-bold text-[11px] text-[#7e6aaf] uppercase tracking-wider">
                    Plan
                  </th>
                 
                  <th className="py-3 px-3.5 font-bold text-[11px] text-[#7e6aaf] uppercase tracking-wider">
                    {statusFilter === "active"
                      ? "Active Boards"
                      : statusFilter === "inactive"
                      ? "Inactive Boards"
                      : "Board List"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {paginatedInvoices.map((inv, idx) => (
                  <tr key={inv?.CustomerId || idx} className="hover:bg-[#fafbff] transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#6214fe] whitespace-nowrap">
                      #{inv?.CompanyUniqueId}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-[#1a0a3c] max-w-[180px]">
                      <span className="block truncate" title={inv?.Email}>
                        {inv?.Email}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <TypeBadge type={inv?.CustomerType} />
                    </td>
                    
                    <td className="py-3 px-3.5">
                      <TableBoardListCell
                        boards={inv?.BoardLists}
                        statusFilter={statusFilter}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 px-1 pt-3 sm:flex-row">
          <span className="text-[12px] text-[#7e6aaf] font-semibold order-2 sm:order-1">
            Page {currentPage} of {totalPages} ({totalData} records)
          </span>

          <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-xl text-[12px] font-semibold text-[#6214fe] disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-[#e8e0ff] shadow-sm flex items-center justify-center active:scale-95 transition-all"
            >
              ‹
            </button>

            {getPageNumbers().map((p, i) =>
              p === "…" ? (
                <span key={`dots-${i}`} className="px-1 text-[12px] text-[#a693c8]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 rounded-xl text-[12px] font-semibold transition-all active:scale-95 ${
                    currentPage === p
                      ? "bg-[#6214fe] text-white shadow-sm font-bold"
                      : "bg-white border border-[#e8e0ff] text-[#1a0a3c] hover:bg-[#faf8ff]"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-xl text-[12px] font-semibold text-[#6214fe] disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-[#e8e0ff] shadow-sm flex items-center justify-center active:scale-95 transition-all"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
