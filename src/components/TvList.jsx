import { useEffect, useState } from "react";
import { GetPOSData } from "../api/AuthApi";
import { UserAuth } from "../context/AuthContext";
import { BaseURL } from "../api/AxisoInstance";
import axios from "axios";

const ITEMS_PER_PAGE = 10;
const ImageUrl = 'https://v.aniboard.com'
// ---- TV configuration -------------------------------------------------
const HORIZONTAL_TVS = [
    { label: "TV 1", value: "H1" },
    { label: "TV 2", value: "H2" },
    { label: "TV 3", value: "H3" },
    { label: "TV 4", value: "H4" },
];

const VERTICAL_TVS = [
    { label: "TV 1", value: "V1" },
    { label: "TV 2", value: "V2" },
    { label: "TV 3", value: "V3" },
    { label: "TV 4", value: "V4" },
];

export default function TvList() {
    const { userDetails } = UserAuth();

    // ---- data --------------------------------------------------------
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // ---- selection / UI -----------------------------------------------
    const [selectedTV, setSelectedTV] = useState("H1"); // <-- default: Horizontal TV1
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [modal, setModal] = useState({ open: false, item: null });
    const [toast, setToast] = useState({ show: false, msg: "" });

    const showToast = (msg) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: "" }), 2500);
    };

    // ---- fetch published design boards --------------------------------
    const getData = async () => {
        setLoading(true);
        const payload = {
            CompanyUniqueId: userDetails?.CompanyUniqueId,
        };
        await axios
            .post(`${BaseURL}DesignBoard/GetPublishedDesignBoardsList`, payload, {
                headers: { "Content-Type": "application/json" },
            })
            .then((res) => {
                setItems(res.data?.Data || []);
            })
            .catch((err) => {
                console.log(err);
                showToast("Failed to load design boards");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        getData();
    }, []);

    // ---- TV tab click: always selects (no toggle-off) -------
    const handleSelectTV = (value) => {
        if (value === selectedTV) return; // already active, nothing to do
        setSelectedTV(value);
        setSelectedProduct(null); // clear selection when switching TVs
    };

    // Items to show below the tabs: filtered to whichever TV tab is active
    const visibleItems = items.filter((item) => item?.SlideType === (selectedTV == "H1" || selectedTV == "H2" || selectedTV == "H3" || selectedTV == "H4"  ? "Horizontal" : "Vertical"));

    console.log(visibleItems);


    // Reset to page 1 whenever the filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedTV]);

    // ---- pagination -----------------------------------------------------
    const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));
    const paginated = visibleItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("…");
            pages.push(totalPages);
        }
        return pages;
    };

    // ---- select an item -> ONE api call to assign it to the active TV --
    const handleSelectProduct = async (item) => {
        setSelectedProduct(item?.PublishBoardUniqueId);
        setAssigning(true);

        // const payload = {
        //     CompanyUniqueId: userDetails?.CompanyUniqueId,
        //     ItemId: item?.ItemId,
        //     TV: selectedTV,
        // };

        // try {
        //     // NOTE: confirm the real endpoint name with your backend team —
        //     // this is the one place to change it if it's different.
        //     await axios.post(`${BaseURL}DesignBoard/AssignDesignBoardToTV`, payload, {
        //         headers: { "Content-Type": "application/json" },
        //     });
        //     showToast(`Assigned "${item?.ItemName}" to ${selectedTV}`);
        // } catch (err) {
        //     console.log(err);
        //     setSelectedProduct(null);
        //     showToast("Failed to assign, please try again");
        // } finally {
        //     setAssigning(false);
        // }
    };

    // ---- modal (edit) ---------------------------------------------------
    const openModal = (item) => setModal({ open: true, item });
    const closeModal = () => setModal({ open: false, item: null });
    const saveModal = async () => {
        // TODO: wire to your update endpoint if/when needed
        closeModal();
        showToast("Updated successfully");
    };

    return (
        <div className="flex flex-col gap-3 p-5">
            {/* TV selector: 4 horizontal + 4 vertical */}
            <div className="flex flex-col gap-3 mb-1 sm:flex-row sticky top-0 z-20 bg-[#f9f6ff] pt-2 pb-3 -mx-5 px-5">
                <div className="flex-1">
                    <span className="block text-[10px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5 px-0.5">
                        Horizontal/Vertical TVs
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {HORIZONTAL_TVS.map((tv) => (
                            <button
                                key={tv.value}
                                onClick={() => handleSelectTV(tv.value)}
                                className={`px-5 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 focus:outline-none ${selectedTV === tv.value
                                    ? "bg-[#6214fe] text-white shadow-[0_4px_12px_rgba(98,20,254,0.3)]"
                                    : "bg-white border border-[#e8e0ff] text-[#6214fe]"
                                    }`}
                            >
                                {tv.label}
                            </button>
                        ))}
                        {VERTICAL_TVS.map((tv) => (
                            <button
                                key={tv.value}
                                onClick={() => handleSelectTV(tv.value)}
                                className={`px-2 py-5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 focus:outline-none ${selectedTV === tv.value
                                    ? "bg-[#6214fe] text-white shadow-[0_4px_12px_rgba(98,20,254,0.3)]"
                                    : "bg-white border border-[#e8e0ff] text-[#6214fe]"
                                    }`}
                            >
                                {tv.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Always shows which TV is active */}
            <p className="text-[11px] text-[#a693c8] px-0.5 -mt-1 mb-1">
                Showing design boards for <span className="font-semibold text-[#6214fe]">{selectedTV}</span>
            </p>

            {/* Loading / empty states */}
            {loading && (
                <p className="text-[13px] text-[#6b5b8a] py-4 text-center">Loading design boards…</p>
            )}
            {!loading && paginated.length === 0 && (
                <p className="text-[13px] text-[#6b5b8a] py-4 text-center">
                    No design boards assigned to {selectedTV} yet.
                </p>
            )}

            {/* List */}
            {paginated.map((item, index) => (
                <label
                    key={item?.PublishBoardUniqueId || index}
                    className={`group relative bg-white rounded-2xl px-4 py-4 flex items-center gap-4 border transition-all duration-200 cursor-pointer
            ${selectedProduct === item?.PublishBoardUniqueId
                            ? "border-[#6214fe] shadow-[0_4px_16px_rgba(98,20,254,0.18)] bg-gradient-to-r from-[#faf8ff] to-white"
                            : "border-[#eee7ff] shadow-[0_2px_8px_rgba(98,20,254,0.06)] hover:border-[#d6c5ff] hover:shadow-[0_4px_12px_rgba(98,20,254,0.10)] hover:-translate-y-0.5"
                        } `}
                >
                    <input
                        type="radio"
                        name="selectedProduct"
                        value={item?.PublishBoardUniqueId}
                        checked={selectedProduct === item?.PublishBoardUniqueId}
                        onChange={() => handleSelectProduct(item)}
                        className="w-[18px] h-[18px] accent-[#6214fe] cursor-pointer flex-shrink-0"
                    />

                    <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200
                ${selectedProduct === item?.PublishBoardUniqueId ? "bg-[#6214fe] text-white" : "bg-[#efeaf9] text-[#6214fe]"}`}
                    >
                        <span className="text-[11px] font-bold">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </span>
                    </div>

                    <div className="w-11 h-11 rounded-xl bg-[#f6f2ff] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img  src={`${ImageUrl}${item?.AnimationImagePath}`} alt="" className="object-contain w-9 h-9" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#1a0a3c] truncate">
                            {item?.DesignBoardName}
                        </p>
                    </div>
                    {selectedProduct === item?.PublishBoardUniqueId && (
                        <div className="w-6 h-6 rounded-full bg-[#6214fe] flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L4.5 8.5L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}
                </label>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-lg text-[12px] font-semibold text-[#6214fe] disabled:opacity-30 disabled:cursor-not-allowed border border-[#e8e0ff]"
                    >
                        ‹
                    </button>
                    {getPageNumbers().map((p, i) =>
                        p === "…" ? (
                            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[12px] text-[#a693c8]">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={`w-8 h-8 rounded-lg text-[12px] font-semibold ${p === currentPage
                                    ? "bg-[#6214fe] text-white"
                                    : "border border-[#e8e0ff] text-[#6214fe]"
                                    }`}
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-lg text-[12px] font-semibold text-[#6214fe] disabled:opacity-30 disabled:cursor-not-allowed border border-[#e8e0ff]"
                    >
                        ›
                    </button>
                </div>
            )}

            {/* Modal */}
            <div
                className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${modal.open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                style={{ background: "rgba(26,10,60,0.45)", backdropFilter: "blur(6px)" }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}
            >
                <div
                    className="w-full max-w-[430px] bg-white rounded-t-[28px] px-5 pt-2 pb-10 max-h-[85vh] overflow-y-auto"
                    style={{
                        transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1)",
                        transform: modal.open ? "translateY(0)" : "translateY(100%)",
                    }}
                >
                    <div className="w-10 h-1 bg-[#e8e0ff] rounded-full mx-auto my-3" />

                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[18px] font-bold text-[#1a0a3c]">Edit Item</h2>
                        <button
                            onClick={closeModal}
                            className="w-9 h-9 rounded-full bg-[#f8f6ff] text-[#6b5b8a] flex items-center justify-center active:scale-90 focus:outline-none"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 mb-6">
                        <div>
                            <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                                Title
                            </label>
                            <input
                                type="text"
                                value={modal.item?.ItemName || ""}
                                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, ItemName: e.target.value } }))}
                                placeholder="Enter Title"
                                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={modal.item?.ItemDescriptation || ""}
                                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, ItemDescriptation: e.target.value } }))}
                                placeholder="Enter Description"
                                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none resize-none leading-relaxed transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                                Price
                            </label>
                            <input
                                type="text"
                                value={modal.item?.ItemPrice || ""}
                                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, ItemPrice: e.target.value } }))}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveModal();
                                    if (e.key === "Escape") closeModal();
                                }}
                                placeholder="Enter Price"
                                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                                Location
                            </label>
                            <input
                                type="text"
                                value={modal.item?.Location || ""}
                                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, Location: e.target.value } }))}
                                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                                TV
                            </label>
                            <input
                                type="text"
                                value={modal.item?.TV ?? ""}
                                readOnly
                                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={closeModal}
                            className="flex-1 py-[14px] border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] font-semibold text-[#6b5b8a] active:scale-[0.97] focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveModal}
                            className="flex-[2] py-[14px] rounded-xl text-[14px] font-bold text-white bg-gradient-to-r from-[#6214fe] to-[#9059fd] shadow-[0_6px_20px_rgba(98,20,254,0.3)] active:scale-[0.97] focus:outline-none"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            <div
                className="fixed bottom-8 left-1/2 bg-[#1a0a3c] text-white px-5 py-3 rounded-full text-[13px] font-semibold shadow-[0_16px_48px_rgba(98,20,254,0.18)] flex items-center gap-2 whitespace-nowrap z-50 pointer-events-none transition-all duration-300"
                style={{
                    transform: toast.show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(64px)",
                    opacity: toast.show ? 1 : 0,
                }}
            >
                <CheckIcon />
                {toast.msg}
            </div>
        </div>
    );
}

function EditIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}