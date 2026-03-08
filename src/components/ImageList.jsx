import { useEffect, useRef, useState } from "react";
import { ElementURL, PrivateAxios, PrivateAxiosFile } from "../api/AxisoInstance";
import { UserAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 5;

const INITIAL_ITEMS = [
  { id: 1, label: "Cover Photo", location: "Location 1" },
  { id: 2, label: "Banner Image", location: "Location 2" },
  { id: 3, label: "Thumbnail", location: "Location 3" },
  { id: 4, label: "Profile Picture", location: "Location 4" },
  { id: 5, label: "Hero Image", location: "Location 5" },
  { id: 6, label: "Gallery Shot 1", location: "Location 6" },
  { id: 7, label: "Gallery Shot 2", location: "Location 7" },
  { id: 8, label: "Gallery Shot 3", location: "Location 8" },
  { id: 9, label: "Background Image", location: "Location 9" },
  { id: 10, label: "Intro Slide", location: "Location 10" },
  { id: 11, label: "Outro Slide", location: "Location 11" },
  { id: 12, label: "Scene 1", location: "Location 12" },
  { id: 13, label: "Scene 2", location: "Location 13" },
  { id: 14, label: "Scene 3", location: "Location 14" },
  { id: 15, label: "Scene 4", location: "Location 15" },
  { id: 16, label: "Storyboard Frame 1", location: "Location 16" },
  { id: 17, label: "Storyboard Frame 2", location: "Location 17" },
  { id: 18, label: "Storyboard Frame 3", location: "Location 18" },
  { id: 19, label: "Promo Image", location: "Location 19" },
  { id: 20, label: "Final Export", location: "Location 20" },
];

export default function ImageList() {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [activeId, setActiveId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const { userDetails } = UserAuth();
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginated = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };

  // const compressImage = (file) => {
  //   return new Promise((resolve, reject) => {
  //     const img = new Image();
  //     const url = URL.createObjectURL(file);

  //     img.onload = () => {
  //       URL.revokeObjectURL(url);

  //       // Proportional ratio maintain
  //       let { width, height } = img;
  //       const maxDimension = 1920;

  //       if (width > maxDimension || height > maxDimension) {
  //         if (width > height) {
  //           height = Math.round((height * maxDimension) / width);
  //           width = maxDimension;
  //         } else {
  //           width = Math.round((width * maxDimension) / height);
  //           height = maxDimension;
  //         }
  //       }

  //       const offscreen = new OffscreenCanvas(width, height);
  //       const ctx = offscreen.getContext("2d");
  //       ctx.drawImage(img, 0, 0, width, height);

  //       // File type detect করো
  //       const mimeType = file.type || "image/jpeg";
  //       // PNG transparency support আছে, JPEG নেই
  //       const isPng = mimeType === "image/png";

  //       const tryCompress = async (quality) => {
  //         const blob = await offscreen.convertToBlob({
  //           type: mimeType,
  //           // PNG lossless তাই quality কাজ করে না, তখন jpeg এ fallback
  //           quality: isPng ? undefined : quality,
  //         });

  //         if (blob.size <= 1 * 1024 * 1024) {
  //           resolve(blob);
  //         } else if (isPng && blob.size > 1 * 1024 * 1024) {
  //           // PNG 1MB এর বেশি হলে JPEG এ convert করো
  //           const jpegBlob = await offscreen.convertToBlob({
  //             type: "image/jpeg",
  //             quality: 0.85,
  //           });

  //           if (jpegBlob.size <= 1 * 1024 * 1024 || quality <= 0.1) {
  //             resolve(jpegBlob);
  //           } else {
  //             tryCompress(Math.max(quality - 0.1, 0.1));
  //           }
  //         } else if (quality <= 0.1) {
  //           resolve(blob);
  //         } else {
  //           tryCompress(Math.max(quality - 0.1, 0.1));
  //         }
  //       };

  //       tryCompress(0.9);
  //     };

  //     img.onerror = reject;
  //     img.src = url;
  //   });
  // };

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // ✅ actual dimension capture করো
        const naturalWidth = img.width;
        const naturalHeight = img.height;

        const canvas = document.createElement("canvas");
        canvas.width = naturalWidth;
        canvas.height = naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0);

        let quality = 0.9;

        const compress = () => {
          canvas.toBlob((blob) => {
            if (!blob) { reject("Compression failed"); return; }

            if (blob.size <= 1024 * 1024 || quality <= 0.1) {
              // ✅ blob এর সাথে dimension-ও return করো
              resolve({ blob, width: naturalWidth, height: naturalHeight });
            } else {
              quality -= 0.1;
              compress();
            }
          }, "image/jpeg", quality);
        };

        compress();
      };

      img.onerror = reject;
      img.src = url;
    });
  };
  const [imageUrl, setImageUrl] = useState('');
  const [showCrop, setShowCrop] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const triggerUpload = (item, uploadMode) => {
    console.log(item);

    setActiveId(item?.Location);
    setImageUrl(item?.ImageName)
    setTimeout(() => {
      if (uploadMode === "camera") {
        if (cameraRef.current) {
          cameraRef.current.value = "";
          cameraRef.current.click();
        }
      } else {
        if (galleryRef.current) {
          galleryRef.current.value = "";
          galleryRef.current.click();
        }
      }
    }, 50);
  };
  const getImageSize = (url) => {
    return new Promise((resolve, reject) => {

      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };

      img.onerror = reject;

      img.src = url;
    });
  };



  const handleFile = async (file) => {
    if (!file || activeId == null) return;
    try {
      const { blob: compressedBlob, width: imageW, height: imageH } = await processImage(file);

      const fileName = file.name.replace(/\.[^/.]+$/, ".jpg");

      const compressedFile = new File([compressedBlob], fileName, {
        type: "image/jpeg"
      });

      const nameParts = file.name.split(".");
      nameParts.pop();
      const cleanName = nameParts.join(".");

      const formData = new FormData();

      formData.append("image", compressedFile);
      formData.append("imageThumb", compressedFile);
      formData.append("companyId", userDetails?.CompanyUniqueId);
      formData.append("folderId", "element");
      formData.append("fileName", `${cleanName}_${Date.now()}`);

      try {
        await PrivateAxiosFile.post("DesignBoard/SaveImageFormFrontEnd", formData)
          .then((res) => {
            const payload = {
              "CategoryId": 5,
              "CompanyUniqueId": userDetails?.CompanyUniqueId,
              "ElementName": res?.fileName,
              "ImageH": imageH,
              "ImageName": res?.data?.physicalPath,
              "ImageNameThumb": res?.data.thumbFileName,
              "ImageSize": 930077,
              "ImageTag": null,
              "ImageW": imageW,
              "Status": 1,
              "UploadFrom": "desktop",
              "Location": activeId
            }
            PrivateAxios.post("DesignBoard/ElementUpsertFromFrontend", payload)
              .then((res) => {
                console.log(res);

              }).catch((err) => {
                console.log(err);

              })

          }).catch((err) => {

          })
      } catch (err) {

      }

      //           const FileUpload = await MyFileUploadData(formData)

      // const formData = new FormData();
      // formData.append("Image", compressedFile);
      // formData.append("Location", activeId);
      // formData.append("CompanyId", 13);
      // formData.append("CategoryId", 5);

      // const formData = new FormData();
      // formData.append("image", compressedBlob, fileName);
      // formData.append("location", activeId);

      // const response = await fetch("https://your-api.com/upload", {
      //   method: "POST",
      //   body: formData,
      // });

      // if (!response.ok) throw new Error("Upload failed");

      // const data = await response.json();

      // setItems((prev) =>
      //   prev.map((item) =>
      //     item.Location === activeId
      //       ? {
      //         ...item,
      //         ImageNameThumb: data.imageUrl,
      //         currentCamera: true,
      //       }
      //       : item
      //   )
      // );

      const previewUrl = URL.createObjectURL(compressedBlob);
      setItems((prev) =>
        prev.map((item) =>
          item.Location === activeId
            ? {
              ...item,
              ImageNameThumb: previewUrl,
              currentCamera: true
            }
            : item
        )
      );

      showToast("Image updated!");
      setActiveId(null);
    } catch (error) {
      console.error("Error:", error);
      showToast("Image upload failed!");
    }
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
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };


  //================================================================================================//
  const GetImageData = async () => {
    try {
      const payload = {
        CategoryId: 5,
        CompanyUniqueId: userDetails?.CompanyUniqueId
      };

      const res = await PrivateAxios.post(
        "DesignBoard/GetElementLocation",
        payload
      );
      setItems(res.data?.Data?.Items)
      console.log("API DATA:", res.data?.Data);

    } catch (err) {
      console.error("API ERROR:", err);
    }
  };

  useEffect(() => {
    GetImageData();
  }, []);



  // useEffect(() => {
  //   async function startCamera() {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: {
  //           facingMode: "environment",
  //           aspectRatio: 1
  //         }
  //       });

  //       if (videoRef.current) {
  //         videoRef.current.srcObject = stream;
  //       }
  //     } catch (err) {
  //       console.error("Camera error:", err);
  //     }
  //   }

  //   startCamera();
  // }, []);





  return (
    <div className="flex flex-col w-full gap-3 p-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#a693c8]">
          Board Images
        </span>
        <span className="text-[12px] font-semibold text-[#6214fe]">{items.length} items</span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-full bg-white rounded-2xl border border-[#ede8f9] shadow-[0_2px_8px_rgba(98,20,254,0.05)] flex items-center gap-3 px-4 py-3"
          >
            {/* Index Badge */}
            <div className="w-7 h-7 rounded-lg bg-[#efeaf9] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#6214fe]">{item?.Location}</span>
            </div>

            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-xl bg-[#efeaf9] flex-shrink-0 overflow-hidden flex items-center justify-center">

              {item.ImageNameThumb ? (
                <img src={item?.currentCamera ? item.ImageNameThumb : ElementURL + item.ImageNameThumb} alt="preview" className="object-cover w-full h-full" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b49de0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[#b8aad4]">
                <LocationIcon />
                <span className="text-[11px]">Location: {item?.Location}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <p className="text-[11px] text-[#a693c8] font-medium truncate mb-0.5">{item?.ElementName}</p>

              </div>
              {/* <p className="text-[13px] font-semibold text-[#1a0a3c] truncate leading-tight">
                {item.name}
              </p> */}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center flex-shrink-0 gap-2">
              <button
                onClick={() => triggerUpload(item, "camera")}
                className="w-9 h-9 rounded-xl bg-[#efeaf9] text-[#6214fe] flex items-center justify-center active:scale-90 transition-transform duration-150 focus:outline-none"
                aria-label="Take photo"
              >
                <CameraIcon />
              </button>
              <button
                onClick={() => triggerUpload(item, "gallery")}
                className="w-9 h-9 rounded-xl bg-[#efeaf9] text-[#6214fe] flex items-center justify-center active:scale-90 transition-transform duration-150 focus:outline-none"
                aria-label="Upload from gallery"
              >
                <EditImageIcon />
              </button>
            </div>
          </div>
        ))}
      </div>



      {/* Hidden Inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

      {/* Toast */}
      <div
        className={`fixed bottom-8 left-1/2 bg-[#1a0a3c] text-white px-5 py-3 rounded-full text-[13px] font-semibold shadow-[0_16px_48px_rgba(98,20,254,0.18)] flex items-center gap-2 whitespace-nowrap transition-all duration-300 z-50 ${toast.show ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        style={{ transform: toast.show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(64px)" }}
      >
        <CheckIcon />
        {toast.msg}
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function EditImageIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}