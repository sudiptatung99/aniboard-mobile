import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { ElementURL, PrivateAxios, PrivateAxiosFile } from "../api/AxisoInstance";
import { UserAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 5;

// Helper to fetch an image as a Blob with cross-origin canvas fallback
const fetchImageBlob = async (url) => {
  try {
    const resp = await fetch(url, { mode: "cors" });
    if (resp.ok) {
      return await resp.blob();
    }
  } catch (e) {
    console.warn("Direct fetch failed, trying image canvas fallback...", e);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas conversion failed"));
        }, "image/png");
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image from source URL"));
    img.src = url;
  });
};

const getItemImageUrl = (item) => {
  if (!item) return "";
  if (item.currentCamera && item.ImageNameThumb) return item.ImageNameThumb;
  const name = item.ImageName || item.ImageNameThumb;
  if (!name) return "";
  if (name.startsWith("http") || name.startsWith("blob:")) return name;
  return `${ElementURL}${name.replace(/^\//, "")}`;
};

const getItemThumbUrl = (item) => {
  if (!item) return "";
  if (item.currentCamera && item.ImageNameThumb) return item.ImageNameThumb;
  const name = item.ImageNameThumb || item.ImageName;
  if (!name) return "";
  if (name.startsWith("http") || name.startsWith("blob:")) return name;
  return `${ElementURL}${name.replace(/^\//, "")}`;
};

const getImageDimensions = (fileOrBlob) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth || img.width || 1920,
        height: img.naturalHeight || img.height || 1080,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for dimensions"));
    };
    img.src = url;
  });
};

// Compress image before sending to remove-background API
// Reduces file size by ~70% while keeping high visual clarity
const compressForBgRemoval = (file) => {
  return new Promise((resolve) => {
    if (!file) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const maxDimension = 1920;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // 0.7 (70%) compression quality: reduces size drastically while preserving sharp quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const cleanName = file.name
              ? file.name.replace(/\.[^/.]+$/, "")
              : "camera_image";
            const compressedFile = new File([blob], `${cleanName}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.7
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

// Ensures strictly ONE element per Location
const deduplicateByLocation = (list) => {
  if (!Array.isArray(list)) return [];
  const map = new Map();
  list.forEach((item) => {
    if (item?.Location == null) return;
    const locKey = String(item.Location);
    const existing = map.get(locKey);
    if (!existing) {
      map.set(locKey, item);
    } else {
      // Keep the most recently updated or highest ElementId
      const existingTime = existing.UpdatedAt ? new Date(existing.UpdatedAt).getTime() : 0;
      const itemTime = item.UpdatedAt ? new Date(item.UpdatedAt).getTime() : 0;
      const existingId = Number(existing.ElementId) || 0;
      const itemId = Number(item.ElementId) || 0;

      if (itemTime > existingTime || (itemTime === existingTime && itemId >= existingId)) {
        map.set(locKey, item);
      }
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => (Number(a.Location) || 0) - (Number(b.Location) || 0)
  );
};

export default function ImageList() {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [activeId, setActiveId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const { userDetails } = UserAuth();

  // Background Removal & Modal States
  const [bgModalStep, setBgModalStep] = useState(null); // null | 'prompt' | 'processing' | 'preview'
  const [bgModalMode, setBgModalMode] = useState("upload"); // 'upload' | 'card_edit'
  const [pendingFile, setPendingFile] = useState(null);
  const [targetCardItem, setTargetCardItem] = useState(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState(null);
  const [isBgProcessing, setIsBgProcessing] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginated = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const maxDimension = 1920;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.7; // 70% quality compression to reduce size while maintaining clarity

        const compress = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }

            if (blob.size <= 1024 * 1024 || quality <= 0.1) {
              resolve({ blob, width, height });
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

  const triggerUpload = (item, uploadMode) => {
    setActiveId(item?.Location);
    setTargetCardItem(item);
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

  // Called when a photo is taken or picked from gallery
  const onFileSelected = (file) => {
    if (!file) return;
    setBgModalMode("upload");
    setPendingFile(file);
    setProcessedBlob(null);
    setProcessedPreviewUrl(null);
    setOriginalPreviewUrl(URL.createObjectURL(file));
    setBgModalStep("prompt");
  };

  // Called when user clicks "Remove Background" on an existing card
  const handleCardEditRemoveBg = (item) => {
    setActiveId(item?.Location);
    setTargetCardItem(item);
    setBgModalMode("card_edit");
    setPendingFile(null);
    setProcessedBlob(null);
    setProcessedPreviewUrl(null);
    const fullUrl = getItemImageUrl(item);
    setOriginalPreviewUrl(fullUrl);
    setBgModalStep("prompt");
  };

  // Modal Cancel / Reset
  const cancelBgModal = () => {
    if (processedPreviewUrl) {
      try {
        URL.revokeObjectURL(processedPreviewUrl);
      } catch (_) {}
    }
    if (originalPreviewUrl && bgModalMode === "upload") {
      try {
        URL.revokeObjectURL(originalPreviewUrl);
      } catch (_) {}
    }
    setBgModalStep(null);
    setBgModalMode("upload");
    setPendingFile(null);
    setTargetCardItem(null);
    setProcessedBlob(null);
    setProcessedPreviewUrl(null);
    setOriginalPreviewUrl(null);
    setIsBgProcessing(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  };

  // User chooses "Yes, Remove Background"
  const handleRemoveBackground = async () => {
    setIsBgProcessing(true);
    setBgModalStep("processing");

    try {
      let fileToSend = pendingFile;

      // If card edit mode and no pendingFile yet, fetch image blob from originalPreviewUrl
      if (bgModalMode === "card_edit" && !fileToSend) {
        const imgUrl = originalPreviewUrl;
        const blob = await fetchImageBlob(imgUrl);
        const ext = blob.type === "image/png" ? "png" : "jpg";
        fileToSend = new File(
          [blob],
          `${targetCardItem?.ElementName || `image_loc_${activeId}`}.${ext}`,
          { type: blob.type || "image/jpeg" }
        );
        setPendingFile(fileToSend);
      }

      if (!fileToSend) {
        throw new Error("No image file available.");
      }

      // Compress camera/uploaded image before sending to remove-background API (70% compression quality)
      const compressedFileToSend = await compressForBgRemoval(fileToSend);

      const formData = new FormData();
      formData.append("file", compressedFileToSend);

      const res = await axios.post(
        "https://api.aniboard.com/api/ImageProcessing/remove-background",
        formData,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const blob = res.data;
      const previewUrl = URL.createObjectURL(blob);
      setProcessedBlob(blob);
      setProcessedPreviewUrl(previewUrl);
      setBgModalStep("preview");
    } catch (err) {
      console.error("Background removal error:", err);
      showToast(err?.message || "Failed to remove background.");
      setBgModalStep("prompt");
    } finally {
      setIsBgProcessing(false);
    }
  };

  // User selects "No, Keep Original"
  const handleKeepOriginal = async () => {
    if (!pendingFile) return;
    const fileToUpload = pendingFile;
    const targetLoc = activeId ?? targetCardItem?.Location;
    cancelBgModal();
    await uploadImageFile(fileToUpload, targetLoc);
  };

  // User confirms the removed-background preview
  const handleConfirmBgRemoved = async () => {
    if (!processedBlob) return;
    const originalName =
      bgModalMode === "card_edit"
        ? targetCardItem?.ElementName || `loc_${activeId}`
        : pendingFile?.name?.replace(/\.[^/.]+$/, "") || `loc_${activeId}`;

    const cleanName = originalName.replace(/\.[^/.]+$/, "");
    const noBgFile = new File([processedBlob], `${cleanName}_nobg.png`, {
      type: "image/png",
    });

    const targetLoc = activeId ?? targetCardItem?.Location;
    cancelBgModal();
    await uploadImageFile(noBgFile, targetLoc);
  };

  // Upload image (either original or background-removed PNG) to the backend
  const uploadImageFile = async (file, targetLocation) => {
    if (!file || targetLocation == null) return;
    setIsUploadingFile(true);

    try {
      const isPng = file.type === "image/png";
      let fileToUpload = file;
      let imageW = 1920;
      let imageH = 1080;

      if (isPng) {
        // PNG transparency preserved (no loss of alpha channel)
        try {
          const dims = await getImageDimensions(file);
          imageW = dims.width;
          imageH = dims.height;
        } catch (dimErr) {
          console.warn("Could not retrieve PNG dimensions:", dimErr);
        }
      } else {
        // JPEG/other compression
        try {
          const { blob: compressedBlob, width, height } = await processImage(file);
          imageW = width;
          imageH = height;
          const fileName = file.name.replace(/\.[^/.]+$/, ".jpg");
          fileToUpload = new File([compressedBlob], fileName, {
            type: "image/jpeg",
          });
        } catch (compErr) {
          console.warn("Compression fallback used:", compErr);
          fileToUpload = file;
        }
      }

      const nameParts = file.name.split(".");
      nameParts.pop();
      const cleanName = nameParts.join(".") || `image_${targetLocation}`;

      const formData = new FormData();
      formData.append("image", fileToUpload);
      formData.append("imageThumb", fileToUpload);
      formData.append("companyId", userDetails?.CompanyUniqueId);
      formData.append("folderId", "element");
      formData.append("fileName", `${cleanName}_${Date.now()}`);

      const saveRes = await PrivateAxiosFile.post(
        "DesignBoard/SaveImageFormFrontEnd",
        formData
      );
      const uploadedData = saveRes?.data;

      const payload = {
        CategoryId: 5,
        CompanyUniqueId: userDetails?.CompanyUniqueId,
        ElementName: uploadedData?.fileName || `${cleanName}_${Date.now()}`,
        ImageH: imageH,
        ImageName: uploadedData?.physicalPath,
        ImageNameThumb: uploadedData?.thumbFileName,
        ImageSize: fileToUpload.size || 930077,
        ImageTag: null,
        ImageW: imageW,
        Status: 1,
        UploadFrom: "desktop",
        Location: targetLocation,
      };

      await PrivateAxios.post("DesignBoard/ElementUpsertFromFrontend", payload);

      const previewUrl = URL.createObjectURL(fileToUpload);
      setItems((prev) => {
        const updated = prev.map((item) =>
          String(item.Location) === String(targetLocation)
            ? {
                ...item,
                ImageNameThumb: previewUrl,
                ImageName: previewUrl,
                currentCamera: true,
              }
            : item
        );
        return deduplicateByLocation(updated);
      });

      showToast("Image updated successfully!");
      setActiveId(null);
      setTargetCardItem(null);
      await GetImageData();
    } catch (error) {
      console.error("Upload error:", error);
      showToast(error?.response?.data?.message || error?.message || "Image upload failed!");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const GetImageData = useCallback(async () => {
    try {
      const payload = {
        CategoryId: 5,
        CompanyUniqueId: userDetails?.CompanyUniqueId,
      };

      const res = await PrivateAxios.post(
        "DesignBoard/GetElementLocation",
        payload
      );
      const rawItems = res.data?.Data?.Items || [];
      setItems(deduplicateByLocation(rawItems));
    } catch (err) {
      console.error("API ERROR:", err);
    }
  }, [userDetails?.CompanyUniqueId]);

  useEffect(() => {
    GetImageData();
  }, [GetImageData]);

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
    <div className="flex flex-col w-full gap-3 p-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#a693c8]">
          Board Images
        </span>
        <span className="text-[12px] font-semibold text-[#6214fe]">
          {items.length} items
        </span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const hasImage = Boolean(item?.ImageNameThumb || item?.ImageName);
          return (
            <div
              key={item.id || item.Location}
              className="w-full bg-white rounded-2xl border border-[#ede8f9] shadow-[0_2px_8px_rgba(98,20,254,0.05)] flex items-center gap-3 px-4 py-3"
            >
              {/* Index Badge */}
              <div className="w-7 h-7 rounded-lg bg-[#efeaf9] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#6214fe]">
                  {item?.Location}
                </span>
              </div>

              {/* Thumbnail */}
              <div
                className="w-12 h-12 rounded-xl bg-[#efeaf9] flex-shrink-0 overflow-hidden flex items-center justify-center border border-[#ede8f9]"
                style={{
                  backgroundImage: hasImage
                    ? `linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                       linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                       linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                       linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`
                    : undefined,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                }}
              >
                {hasImage ? (
                  <img
                    src={getItemThumbUrl(item)}
                    alt="preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#b49de0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                  <p className="text-[11px] text-[#a693c8] font-medium truncate mb-0.5">
                    {item?.ElementName || "No Image Set"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-shrink-0 gap-1.5">
                {/* AI Background Removal option for existing image */}
                {/* {hasImage && (
                  <button
                    type="button"
                    onClick={() => handleCardEditRemoveBg(item)}
                    className="w-9 h-9 rounded-xl bg-[#efeaf9] text-[#6214fe] hover:bg-[#6214fe] hover:text-white flex items-center justify-center active:scale-90 transition-all duration-150 focus:outline-none cursor-pointer"
                    title="Remove Background from this image"
                    aria-label="Remove background"
                  >
                    <SparklesIcon className="w-4 h-4" />
                  </button>
                )} */}

                {/* Mobile Camera Upload */}
                <button
                  type="button"
                  onClick={() => triggerUpload(item, "camera")}
                  className="w-9 h-9 rounded-xl bg-[#efeaf9] text-[#6214fe] hover:bg-[#6214fe] hover:text-white flex items-center justify-center active:scale-90 transition-all duration-150 focus:outline-none cursor-pointer"
                  title="Take photo with camera"
                  aria-label="Take photo"
                >
                  <CameraIcon />
                </button>

                {/* Gallery Upload */}
                <button
                  type="button"
                  onClick={() => triggerUpload(item, "gallery")}
                  className="w-9 h-9 rounded-xl bg-[#efeaf9] text-[#6214fe] hover:bg-[#6214fe] hover:text-white flex items-center justify-center active:scale-90 transition-all duration-150 focus:outline-none cursor-pointer"
                  title="Upload from gallery"
                  aria-label="Upload from gallery"
                >
                  <EditImageIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />

      {/* Background Removal Modal */}
      {bgModalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeSlideUp">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#efeaf9] text-[#6214fe]">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {bgModalMode === "card_edit"
                      ? "Edit Asset - Remove Background"
                      : "Remove Background"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {bgModalMode === "card_edit"
                      ? `Location ${targetCardItem?.Location ?? activeId} image`
                      : "AI Background Removal"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cancelBgModal}
                disabled={isBgProcessing || isUploadingFile}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto">
              {bgModalStep === "prompt" && (
                <div className="space-y-4">
                  <div className="relative flex items-center justify-center w-full p-3 overflow-hidden border shadow-inner aspect-video max-h-52 rounded-2xl bg-slate-100 border-slate-200">
                    {originalPreviewUrl ? (
                      <img
                        src={originalPreviewUrl}
                        alt="Original Preview"
                        className="object-contain max-w-full max-h-full"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">No preview available</div>
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-800/70 text-white text-[10px] font-medium backdrop-blur-xs">
                      Original
                    </span>
                  </div>

                  <div className="space-y-1 text-center">
                    <h4 className="text-sm font-bold text-slate-800">
                      {bgModalMode === "card_edit"
                        ? `Remove background for Location ${targetCardItem?.Location ?? activeId}?`
                        : "Do you want to remove the background of this image?"}
                    </h4>
                    <p className="max-w-xs mx-auto text-xs text-slate-500">
                      Our AI will isolate the foreground subject and make the background transparent.
                    </p>
                  </div>
                </div>
              )}

              {bgModalStep === "processing" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#efeaf9] flex items-center justify-center text-[#6214fe]">
                    <RefreshCwIcon className="w-7 h-7 animate-spin text-[#6214fe]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Removing Background...
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Please wait while our AI processes your image.
                    </p>
                  </div>
                </div>
              )}

              {bgModalStep === "preview" && (
                <div className="space-y-4">
                  <div
                    className="relative flex items-center justify-center w-full p-3 overflow-hidden border shadow-inner aspect-video max-h-52 rounded-2xl border-slate-200"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                                        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                                        linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                                        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`,
                      backgroundSize: "16px 16px",
                      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {processedPreviewUrl && (
                      <img
                        src={processedPreviewUrl}
                        alt="Background Removed"
                        className="object-contain max-w-full max-h-full drop-shadow-md"
                      />
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold shadow-xs">
                      Transparent
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-600">
                      Background removed successfully!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 justify-end">
              {bgModalStep === "prompt" && (
                <>
                  <button
                    type="button"
                    onClick={cancelBgModal}
                    className="w-full px-4 py-2 text-xs font-semibold transition border cursor-pointer sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  {bgModalMode === "upload" && (
                    <button
                      type="button"
                      onClick={handleKeepOriginal}
                      className="w-full px-4 py-2 text-xs font-bold transition cursor-pointer sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl"
                    >
                      No, Keep Original
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    className="w-full sm:w-auto px-4 py-2 bg-[#6214fe] hover:bg-[#500ed8] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-[#6214fe]/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>Yes, Remove Background</span>
                  </button>
                </>
              )}

              {bgModalStep === "preview" && (
                <>
                  <button
                    type="button"
                    onClick={cancelBgModal}
                    disabled={isUploadingFile}
                    className="w-full px-4 py-2 text-xs font-semibold transition border cursor-pointer sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBgRemoved}
                    disabled={isUploadingFile}
                    className="w-full sm:w-auto px-5 py-2 bg-[#6214fe] hover:bg-[#500ed8] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-[#6214fe]/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingFile ? (
                      <>
                        <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>OK, Upload This Image</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className={`fixed bottom-8 left-1/2 bg-[#1a0a3c] text-white px-5 py-3 rounded-full text-[13px] font-semibold shadow-[0_16px_48px_rgba(98,20,254,0.18)] flex items-center gap-2 whitespace-nowrap transition-all duration-300 z-50 ${
          toast.show ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          transform: toast.show
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(64px)",
        }}
      >
        <CheckIcon className="w-3.5 h-3.5" />
        {toast.msg}
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function EditImageIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function RefreshCwIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CheckIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}