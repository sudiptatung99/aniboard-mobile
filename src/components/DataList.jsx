import { useEffect, useState } from "react";
import { GetPOSData } from "../api/AuthApi";
import { UserAuth } from "../context/AuthContext";
import { BaseURL } from "../api/AxisoInstance";
import axios from "axios";

const ITEMS_PER_PAGE = 5;

const INITIAL_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `Product ${i + 1}`,
  description: `This is a short description for product ${i + 1}.`,
  price: `$${(19.99 + i * 5).toFixed(2)}`,
  location: `Location ${i + 1}`,
}));

export default function DataList() {
  const [items, setItems] = useState(INITIAL_DATA);
  const [modal, setModal] = useState({ open: false, item: null, });
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginated = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };

  const openModal = (item) => {
    setModal({ open: true, item });
  };

  const closeModal = () => setModal({ open: false, item: null, });

  const saveModal = async () => {
    console.log(modal.item);

    const payload = [
      {
        Cus_ID: userDetails?.Email,
        Items: [
          {
            TV: "",
            Location: modal.item?.Location,
            MenuItemName: modal.item?.ItemName,
            Description: modal.item?.ItemDescriptation,
            Price1: modal.item?.ItemPrice ? String(modal.item?.ItemPrice) : "",
            ItemId:  modal.item?.ItemId,
            ProcessDate: "",
            CompanyId: userDetails?.CompanyUniqueId,
            IsShow: true
          }
        ]
      }
    ];
    await axios.post(`${BaseURL}DesignBoard/UpsertWebhook`, payload, {

      headers: {
        "Content-Type": "application/json"

      }
    })
      .then((res) => {
        console.log(res);
        getData();
         closeModal();
         
      }).catch((err) => {
        console.log(err);

      })
    //
    // showToast("Updated successfully");
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
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };


  // =============================================================//
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { userDetails } = UserAuth();
  const getData = async () => {
    setLoading(true)
    const payload = {
      userName: userDetails?.Email
    }
    try {
      const result = await GetPOSData(payload);
      setProducts(result?.Data);

      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  };
  useEffect(() => {
    getData();
  }, [])

  return (
    <div className="flex flex-col gap-3 p-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#a693c8]">
          Product List
        </span>
        <span className="bg-[#efeaf9] text-[#6214fe] text-[11px] font-bold px-2.5 py-1 rounded-full">
          {products?.length} items
        </span>
      </div>

      {/* List */}
      {products.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl px-4 py-4 flex items-center gap-4 shadow-[0_2px_8px_rgba(98,20,254,0.08)] border border-[#e8e0ff]"
        >
          {/* Index */}
          <div className="w-8 h-8 rounded-xl bg-[#efeaf9] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-[#6214fe]">{item?.Location}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-[14px] font-semibold text-[#1a0a3c] truncate">{item?.ItemName}</p>
              <span className="text-[11px] font-bold text-[#6214fe] bg-[#efeaf9] px-2 py-0.5 rounded-full flex-shrink-0">
                {item?.ItemPrice}
              </span>
            </div>
            <p className="text-[12px] text-[#a693c8] truncate mb-0.5">{item?.ItemDescriptation}</p>
            <div className="flex items-center gap-1 text-[#b8aad4]">
              <LocationIcon />
              <span className="text-[11px]">Location: {item?.Location}</span>
            </div>
          </div>

          {/* Edit */}
          <button
            onClick={() => openModal(item)}
            className="w-9 h-9 rounded-[11px] bg-[#efeaf9] text-[#6214fe] flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:bg-[#dccbff] active:scale-90 focus:outline-none"
            aria-label={`Edit ${item.title}`}
          >
            <EditIcon />
          </button>
        </div>
      ))}

      {/* Pagination */}
      {/* <div className="flex items-center justify-between px-1 mt-2">
        <span className="text-[11px] text-[#a693c8] font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-xl bg-white border border-[#ede8f9] text-[#6214fe] flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all duration-150 focus:outline-none shadow-[0_1px_4px_rgba(98,20,254,0.06)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "…" ? (
              <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-[#b8aad4] text-[12px]">…</span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-8 h-8 rounded-xl text-[12px] font-semibold flex items-center justify-center transition-all duration-150 focus:outline-none active:scale-90 ${currentPage === page
                  ? "bg-[#6214fe] text-white shadow-[0_4px_12px_rgba(98,20,254,0.3)]"
                  : "bg-white border border-[#ede8f9] text-[#6214fe] shadow-[0_1px_4px_rgba(98,20,254,0.06)]"
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-xl bg-white border border-[#ede8f9] text-[#6214fe] flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all duration-150 focus:outline-none shadow-[0_1px_4px_rgba(98,20,254,0.06)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div> */}
    

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${modal.open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        style={{ background: "rgba(26,10,60,0.45)", backdropFilter: "blur(6px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div
          className={`w-full max-w-[430px] bg-white rounded-t-[28px] px-5 pt-2 pb-10 max-h-[85vh] overflow-y-auto`}
          style={{ transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1)", transform: modal.open ? "translateY(0)" : "translateY(100%)" }}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-[#e8e0ff] rounded-full mx-auto my-3" />

          {/* Modal Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-bold text-[#1a0a3c]">Edit Item #{modal.item?.id}</h2>
            <button onClick={closeModal} className="w-9 h-9 rounded-full bg-[#f8f6ff] text-[#6b5b8a] flex items-center justify-center active:scale-90 focus:outline-none">
              <CloseIcon />
            </button>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4 mb-6">
            <div >
              <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={modal.item?.ItemName || ""}
                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, ["ItemName"]: e.target.value } }))}

                placeholder={"Enter Title"}
                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
              />
            </div>
            <div >
              <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={modal.item?.ItemDescriptation || ""}
                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, ["ItemDescriptation"]: e.target.value } }))}
                placeholder={"Enter Description"}
                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none resize-none leading-relaxed transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
              />
            </div>
            <div >
              <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                Price
              </label>
              <input
                type="text"
                value={modal.item?.ItemPrice || ""}
                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, ["ItemPrice"]: e.target.value } }))}
                onKeyDown={(e) => { if (e.key === "Enter") saveModal(); if (e.key === "Escape") closeModal(); }}
                placeholder="Enter Price"
                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
              />
            </div>
            <div >
              <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={modal.item?.Location || ""}
                // onChange={(e) => setModal((m) => ({ ...m, draft: { ...m.draft, [key]: e.target.value } }))}
                // onKeyDown={(e) => { if (e.key === "Enter") saveModal(); if (e.key === "Escape") closeModal(); }}
                // placeholder={placeholder}
                className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
              />
            </div>

            {/* {[
              { key: "title", label: "Title", placeholder: "Enter title" },
              { key: "description", label: "Description", placeholder: "Enter description", textarea: true },
              { key: "price", label: "Price", placeholder: "e.g. $19.99" },
              { key: "location", label: "Location", placeholder: "Enter location" },
            ].map(({ key, label, placeholder, textarea }) => (
              <div >
                <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-[#a693c8] mb-1.5">
                  {label}
                </label>
                {textarea ? (
                  <textarea
                    rows={3}
                    value={modal.draft[key] || ""}
                    onChange={(e) => setModal((m) => ({ ...m, draft: { ...m.draft, [key]: e.target.value } }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none resize-none leading-relaxed transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
                  />
                ) : (
                  <input
                    type="text"
                    value={modal.draft[key] || ""}
                    onChange={(e) => setModal((m) => ({ ...m, draft: { ...m.draft, [key]: e.target.value } }))}
                    onKeyDown={(e) => { if (e.key === "Enter") saveModal(); if (e.key === "Escape") closeModal(); }}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border-[1.5px] border-[#e8e0ff] rounded-xl text-[14px] text-[#1a0a3c] bg-[#f8f6ff] outline-none transition-all duration-200 focus:border-[#6214fe] focus:bg-white focus:shadow-[0_0_0_4px_rgba(98,20,254,0.08)]"
                  />
                )}
              </div>
            ))} */}
          </div>

          {/* Actions */}
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
        style={{ transform: toast.show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(64px)", opacity: toast.show ? 1 : 0 }}
      >
        <CheckIcon />
        {toast.msg}
      </div>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
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
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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