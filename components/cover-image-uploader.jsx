"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useAdminFetch } from "./admin-session-context";
import { useUploader } from "./use-uploader";
import {
  MIN_CROP_EDGE,
  TARGET_DISPLAY_WIDTH,
  UPSCALE_THRESHOLD,
  buildFileNameFromAlt,
  computeCropResolution,
  createCroppedBlob,
  readFileAsDataUrl,
  sanitizeAlt
} from "./uploader-utils";

const ACCEPT_INPUT = "image/*";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ALT_MAX_LENGTH = 180;
const MEDIA_PAGE_SIZE = 18;
const ASPECT_OPTIONS = [
  { id: "three-two", label: "3:2", value: 3 / 2 },
  { id: "one-one", label: "1:1", value: 1 }
];
const DEFAULT_ASPECT = ASPECT_OPTIONS[0];
const DEFAULT_WIDTH_PERCENT = 90;
const MIN_WIDTH_PERCENT = 35;

function validateImageFile(file) {
  if (!(file instanceof File)) {
    return "Only file uploads are supported.";
  }
  if (!file.type?.startsWith("image/")) {
    return "Unsupported file type.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" exceeds the 25MB limit.`;
  }
  return null;
}

export default function CoverImageUploader({ value, alt, onChange }) {
  const adminFetch = useAdminFetch();
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const imgRef = useRef(null);
  const portalTargetRef = useRef(typeof document !== "undefined" ? document.body : null);
  const altRef = useRef(alt || "");

  const [isDragActive, setIsDragActive] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [aspect, setAspect] = useState(DEFAULT_ASPECT.value);
  const [cropWidthPercent, setCropWidthPercent] = useState(DEFAULT_WIDTH_PERCENT);
  const [cropResolution, setCropResolution] = useState({ width: 0, height: 0 });
  const [altValue, setAltValue] = useState(alt || "");
  const [error, setError] = useState("");
  const [isExistingOpen, setIsExistingOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaOffset, setMediaOffset] = useState(0);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [hasLoadedMedia, setHasLoadedMedia] = useState(false);

  const hasValue = Boolean(value && value.trim());

  const resetCropState = useCallback(() => {
    setIsCropping(false);
    setImageSrc(null);
    setActiveFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropResolution({ width: 0, height: 0 });
    setCropWidthPercent(DEFAULT_WIDTH_PERCENT);
    setAspect(DEFAULT_ASPECT.value);
  }, []);

  const requestUpload = useCallback(
    async ({ file, signal }) => {
      const body = new FormData();
      body.append("file", file);

      const response = await adminFetch("/api/upload", {
        method: "POST",
        body,
        signal
      });

      let result;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        const message = result?.error || `Upload failed with status ${response.status}`;
        throw new Error(message);
      }

      if (!result?.url) {
        throw new Error("Upload completed without a file URL.");
      }

      return result;
    },
    [adminFetch]
  );

  const {
    state: uploadState,
    uploadFiles: enqueueUploads,
    cancelAll: cancelUploads,
    clearWarnings: clearUploadWarnings
  } = useUploader({
    maxFileSize: MAX_FILE_SIZE_BYTES,
    maxFilesPerBatch: 1,
    acceptedMimePrefixes: ["image/"],
    acceptedMimeTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    validateFile: validateImageFile,
    requestUpload,
    normalizeResponse: (record, file) => ({
      url: record?.url || "",
      pathname: record?.pathname || "",
      meta: {
        name: file?.name || "",
        type: record?.type || file?.type || "",
        size: record?.size ?? file?.size ?? 0
      }
    }),
    onFileStart: () => {
      setError("");
    },
    onFileSuccess: (payload) => {
      const resolvedAlt = sanitizeAlt(altRef.current) || "Cover image";
      altRef.current = resolvedAlt;
      setAltValue(resolvedAlt);
      onChange?.({ url: payload.url, alt: resolvedAlt });
      setMediaItems((prev) => [{ ...payload, alt: resolvedAlt }, ...prev.filter((item) => item.pathname !== payload.pathname)]);
      setHasLoadedMedia(true);
      setIsExistingOpen(false);
      resetCropState();
    },
    onFileError: (uploadError) => {
      setError(uploadError?.message || "Upload failed.");
    },
    onFileCancel: () => {
      setError("Upload cancelled.");
    }
  });

  const isUploading = uploadState.status === "uploading" || uploadState.status === "queued";
  const uploaderErrorMessage =
    typeof uploadState.error === "string"
      ? uploadState.error
      : uploadState.error instanceof Error
        ? uploadState.error.message
        : null;
  const pendingUploads = (uploadState.files || []).filter(
    (file) => file.status === "uploading" || file.status === "pending"
  ).length;

  useEffect(() => {
    altRef.current = altValue;
  }, [altValue]);

  useEffect(() => {
    if (!isCropping) {
      setAltValue(alt || "");
      altRef.current = alt || "";
    }
  }, [alt, isCropping]);

  useEffect(() => {
    if (!completedCrop || !imgRef.current) {
      setCropResolution({ width: 0, height: 0 });
      return;
    }
    setCropResolution(computeCropResolution(completedCrop, imgRef.current));
  }, [completedCrop]);

  useEffect(
    () => () => {
      cancelUploads();
    },
    [cancelUploads]
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      portalTargetRef.current = document.body;
    }
  }, []);

  const closeCropper = useCallback(() => {
    cancelUploads();
    resetCropState();
  }, [cancelUploads, resetCropState]);

  useEffect(() => {
    if (!isCropping && !isExistingOpen && dropzoneRef.current) {
      dropzoneRef.current.focus();
    }
  }, [isCropping, isExistingOpen]);

  useEffect(() => {
    if (!isCropping && !isExistingOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isCropping) {
          closeCropper();
        } else if (isExistingOpen) {
          setIsExistingOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeCropper, isCropping, isExistingOpen]);

  const handleIncomingFiles = useCallback(async (files) => {
    const selection = Array.from(files).filter(Boolean);
    if (!selection.length) return;
    const [file] = selection;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setActiveFile(file);
      setImageSrc(dataUrl);
      setIsCropping(true);
      setError("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCropWidthPercent(DEFAULT_WIDTH_PERCENT);
      setCropResolution({ width: 0, height: 0 });
      const defaultAlt = sanitizeAlt(file.name) || "Cover image";
      setAltValue(defaultAlt);
      altRef.current = defaultAlt;
      setAspect(DEFAULT_ASPECT.value);
    } catch (readError) {
      setError(readError?.message || "Could not read file.");
    }
  }, []);

  const handleFileButtonClick = useCallback(() => {
    setError("");
    setIsExistingOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (files.length) {
        handleIncomingFiles(files);
      }
    },
    [handleIncomingFiles]
  );

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      const dropped = Array.from(event.dataTransfer?.files ?? []);
      if (dropped.length) {
        handleIncomingFiles(dropped);
      }
    },
    [handleIncomingFiles]
  );

  const handleDropzoneKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleFileButtonClick();
      }
    },
    [handleFileButtonClick]
  );

  const handleImageLoad = useCallback(
    (event) => {
      const { naturalWidth, naturalHeight } = event.currentTarget;
      const nextCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: cropWidthPercent }, aspect, naturalWidth, naturalHeight),
        naturalWidth,
        naturalHeight
      );
      setCrop(nextCrop);
      setCompletedCrop(nextCrop);
    },
    [aspect, cropWidthPercent]
  );

  const handleCropChange = useCallback((nextCrop) => {
    setCrop(nextCrop);
    if (nextCrop?.unit === "%") {
      setCropWidthPercent(nextCrop.width);
    }
  }, []);

  const handleCropComplete = useCallback((nextCrop) => {
    setCompletedCrop(nextCrop);
  }, []);

  const handleAspectChange = useCallback(
    (nextAspect) => {
      if (aspect === nextAspect) return;
      setAspect(nextAspect);
      if (!imgRef.current) return;
      const { naturalWidth, naturalHeight } = imgRef.current;
      const nextCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: cropWidthPercent }, nextAspect, naturalWidth, naturalHeight),
        naturalWidth,
        naturalHeight
      );
      setCrop(nextCrop);
      setCompletedCrop(nextCrop);
    },
    [aspect, cropWidthPercent]
  );

  const handleZoomChange = useCallback(
    (event) => {
      const nextWidth = Math.max(MIN_WIDTH_PERCENT, Math.min(Number(event.target.value), 100));
      setCropWidthPercent(nextWidth);
      if (!imgRef.current) return;
      const { naturalWidth, naturalHeight } = imgRef.current;
      const nextCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: nextWidth }, aspect, naturalWidth, naturalHeight),
        naturalWidth,
        naturalHeight
      );
      setCrop(nextCrop);
      setCompletedCrop(nextCrop);
    },
    [aspect]
  );

  const handleSaveCrop = useCallback(async () => {
    if (!activeFile || !completedCrop || !imgRef.current) {
      setError("Please adjust the crop before saving.");
      return;
    }

    const { width, height } = cropResolution;
    if (width < MIN_CROP_EDGE || height < MIN_CROP_EDGE) {
      setError(`Crop must be at least ${MIN_CROP_EDGE}px on both sides.`);
      return;
    }

    const finalAlt = sanitizeAlt(altValue) || sanitizeAlt(activeFile.name);
    if (!finalAlt) {
      setError("Alt text is required.");
      return;
    }

    try {
      setError("");
      altRef.current = finalAlt;
      clearUploadWarnings();
      const blob = await createCroppedBlob(imgRef.current, completedCrop, activeFile.type || "image/jpeg");
      const extension = activeFile.name.includes(".") ? `.${activeFile.name.split(".").pop()}` : ".jpg";
      const uploadFile = new File([blob], buildFileNameFromAlt(finalAlt, extension), {
        type: blob.type || activeFile.type || "image/jpeg"
      });
      await enqueueUploads([uploadFile]);
    } catch (uploadErr) {
      setError(uploadErr?.message || "Upload failed.");
    }
  }, [activeFile, altValue, clearUploadWarnings, completedCrop, cropResolution, enqueueUploads]);

  const handleAltChange = useCallback(
    (event) => {
      const nextValue = event.target.value.slice(0, ALT_MAX_LENGTH);
      setAltValue(nextValue);
      altRef.current = nextValue;
      if (value) {
        onChange?.({ url: value, alt: nextValue });
      }
    },
    [onChange, value]
  );

  const fetchMedia = useCallback(
    async ({ reset = false, searchTerm } = {}) => {
      setIsLoadingMedia(true);
      setMediaError("");
      const appliedSearch = searchTerm ?? mediaSearch;
      const offset = reset ? 0 : mediaOffset;
      try {
        const params = new URLSearchParams();
        params.set("limit", MEDIA_PAGE_SIZE.toString());
        params.set("offset", offset.toString());
        if (appliedSearch.trim()) {
          params.set("search", appliedSearch.trim());
        }
        const response = await fetch(`/api/media?${params.toString()}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load media");
        }
        setMediaItems((prev) => (reset ? data.files : [...prev, ...data.files]));
        setMediaOffset(data.nextOffset ?? offset + data.files.length);
        setHasMoreMedia(Boolean(data.hasMore));
        setHasLoadedMedia(true);
      } catch (fetchError) {
        setMediaError(fetchError?.message || "Failed to load media");
      } finally {
        setIsLoadingMedia(false);
      }
    },
    [mediaOffset, mediaSearch]
  );

  const toggleExisting = useCallback(() => {
    setError("");
    setIsExistingOpen((previous) => {
      const next = !previous;
      if (next && !hasLoadedMedia) {
        fetchMedia({ reset: true });
      }
      return next;
    });
  }, [fetchMedia, hasLoadedMedia]);

  const handleExistingSearchChange = useCallback((event) => {
    setMediaSearch(event.target.value);
  }, []);

  const handleExistingSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      fetchMedia({ reset: true, searchTerm: mediaSearch });
    },
    [fetchMedia, mediaSearch]
  );

  const handleClearSearch = useCallback(() => {
    setMediaSearch("");
    fetchMedia({ reset: true, searchTerm: "" });
  }, [fetchMedia]);

  const handleLoadMoreMedia = useCallback(() => {
    if (isLoadingMedia || !hasMoreMedia) return;
    fetchMedia({ reset: false });
  }, [fetchMedia, hasMoreMedia, isLoadingMedia]);

  const handleSelectExisting = useCallback(
    (item) => {
      const nextAlt = sanitizeAlt(item.alt || item.title || item.pathname) || "Cover image";
      setAltValue(nextAlt);
      altRef.current = nextAlt;
      onChange?.({ url: item.url, alt: nextAlt });
      setIsExistingOpen(false);
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    cancelUploads();
    resetCropState();
    setAltValue("");
    altRef.current = "";
    onChange?.({ url: "", alt: "" });
  }, [cancelUploads, onChange, resetCropState]);

  const renderOverlay = useCallback(
    (node) => {
      if (!node) return null;
      const target = portalTargetRef.current;
      return target ? createPortal(node, target) : node;
    },
    []
  );

  const zoomLabel = useMemo(() => (100 / cropWidthPercent).toFixed(1), [cropWidthPercent]);
  const altIsRequired = hasValue || isCropping;
  const altIsValid = !altIsRequired || altValue.trim().length > 0;
  const altLength = altValue.length;

  const statusMessages = useMemo(() => {
    const messages = [];

    if (error) {
      messages.push({ variant: "error", text: error });
    } else if (uploaderErrorMessage) {
      messages.push({ variant: "error", text: uploaderErrorMessage });
    }

    if (isCropping && cropResolution.width && cropResolution.height) {
      const upscaleFactor = TARGET_DISPLAY_WIDTH / cropResolution.width;
      if (upscaleFactor > UPSCALE_THRESHOLD) {
        messages.push({
          variant: "hint",
          text: `This crop will upscale ${upscaleFactor.toFixed(1)}× on large displays.`
        });
      }
    }

    if (isUploading) {
      const uploadingLabel = pendingUploads > 1 ? `Uploading ${pendingUploads} files…` : "Uploading cover…";
      messages.push({ variant: "hint", text: uploadingLabel });
    }

    if (uploadState.limited > 0) {
      messages.push({
        variant: "hint",
        text: `Skipped ${uploadState.limited} file${uploadState.limited === 1 ? "" : "s"} to keep the queue responsive.`
      });
    }

    if (uploadState.duplicates?.length) {
      messages.push({
        variant: "hint",
        text: `${uploadState.duplicates.length} duplicate file${uploadState.duplicates.length === 1 ? "" : "s"} skipped.`
      });
    }

    if (uploadState.rejected?.length) {
      const firstReason = uploadState.rejected[0]?.reason || "Unsupported file.";
      const rejectedText =
        uploadState.rejected.length === 1
          ? firstReason
          : `${uploadState.rejected.length} file(s) rejected. ${firstReason}`;
      messages.push({ variant: "error", text: rejectedText });
    }

    if (mediaError && isExistingOpen) {
      messages.push({ variant: "error", text: mediaError });
    }

    if (altIsRequired && !altIsValid) {
      messages.push({ variant: "error", text: "Alt text is required." });
    }

    return messages;
  }, [
    cropResolution.height,
    cropResolution.width,
    error,
    isCropping,
    isExistingOpen,
    isUploading,
    mediaError,
    pendingUploads,
    uploadState.duplicates,
    uploadState.limited,
    uploadState.rejected,
    uploaderErrorMessage,
    altIsRequired,
    altIsValid
  ]);

  const cropOverlay = isCropping
    ? (
        <div className="cover-uploader__overlay" role="dialog" aria-modal="true">
          <div className="cover-uploader__sheet cover-uploader__sheet--crop">
            <header className="cover-uploader__sheet-header">
              <h2>Crop cover image</h2>
              <button type="button" className="admin-ghost" onClick={closeCropper} disabled={isUploading}>
                Close
              </button>
            </header>
            <div className="cover-uploader__crop-container">
              <ReactCrop
                crop={crop}
                onChange={handleCropChange}
                onComplete={handleCropComplete}
                aspect={aspect}
                ruleOfThirds
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Cover crop preview"
                  onLoad={handleImageLoad}
                  className="cover-uploader__crop-image"
                />
              </ReactCrop>
            </div>
            <div className="cover-uploader__crop-controls">
              <div className="cover-uploader__aspect">
                {ASPECT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`cover-uploader__aspect-btn${aspect === option.value ? " is-active" : ""}`}
                    onClick={() => handleAspectChange(option.value)}
                    disabled={isUploading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="cover-uploader__zoom">
                <span>Zoom</span>
                <input
                  type="range"
                  min={MIN_WIDTH_PERCENT}
                  max={100}
                  step={1}
                  value={Math.round(cropWidthPercent)}
                  onChange={handleZoomChange}
                  disabled={isUploading}
                />
                <span className="cover-uploader__zoom-value">{zoomLabel}×</span>
              </label>
              <div className="cover-uploader__resolution">
                Resolution: {cropResolution.width && cropResolution.height ? `${cropResolution.width} × ${cropResolution.height}px` : "—"}
              </div>
            </div>
            <div className="cover-uploader__footer">
              <button type="button" className="admin-ghost" onClick={closeCropper} disabled={isUploading}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary"
                onClick={handleSaveCrop}
                disabled={isUploading}
              >
                {isUploading ? "Uploading…" : "Save crop"}
              </button>
            </div>
          </div>
        </div>
      )
    : null;

  const existingOverlay = isExistingOpen
    ? (
        <div className="cover-uploader__overlay" role="dialog" aria-modal="true">
          <div className="cover-uploader__sheet cover-uploader__sheet--media">
            <header className="cover-uploader__sheet-header">
              <h2>Select existing image</h2>
              <button type="button" className="admin-ghost" onClick={() => setIsExistingOpen(false)}>
                Close
              </button>
            </header>
            <form className="cover-uploader__search" onSubmit={handleExistingSearchSubmit}>
              <input
                type="search"
                value={mediaSearch}
                onChange={handleExistingSearchChange}
                placeholder="Search media"
                aria-label="Search media"
              />
              <button type="submit" className="admin-primary" disabled={isLoadingMedia}>
                Search
              </button>
              {mediaSearch ? (
                <button type="button" className="admin-ghost" onClick={handleClearSearch} disabled={isLoadingMedia}>
                  Clear
                </button>
              ) : null}
            </form>
            <div className="cover-uploader__media-grid">
              {isLoadingMedia && !mediaItems.length ? (
                <p className="cover-uploader__empty">Loading…</p>
              ) : mediaItems.length ? (
                mediaItems.map((item) => (
                  <button
                    type="button"
                    key={item.pathname}
                    className="cover-uploader__media-item"
                    onClick={() => handleSelectExisting(item)}
                  >
                    <div className="cover-uploader__media-thumb">
                      <Image
                        src={item.url}
                        alt={item.alt || item.title || "Media option"}
                        fill
                        sizes="180px"
                        className="cover-uploader__media-image"
                      />
                    </div>
                    <span>{item.title || item.alt || item.pathname}</span>
                  </button>
                ))
              ) : (
                <p className="cover-uploader__empty">No images yet.</p>
              )}
            </div>
            <div className="cover-uploader__media-footer">
              {hasMoreMedia ? (
                <button type="button" className="admin-ghost" onClick={handleLoadMoreMedia} disabled={isLoadingMedia}>
                  {isLoadingMedia ? "Loading…" : "Load more"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )
    : null;

  return (
    <div className="cover-uploader">
      <div
        ref={dropzoneRef}
        className={`cover-uploader__dropzone${isDragActive ? " is-drag-over" : ""}${isUploading ? " is-busy" : ""}`}
        role="button"
        tabIndex={0}
        onClick={handleFileButtonClick}
        onKeyDown={handleDropzoneKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label={hasValue ? "Change cover image" : "Upload cover image"}
      >
        {hasValue && value ? (
          <Image
            src={value}
            alt={altValue || "Cover image"}
            fill
            sizes="(max-width: 900px) 100vw, 420px"
            className="cover-uploader__preview-image"
          />
        ) : (
          <div className="cover-uploader__placeholder">
            <span>Drop an image or click to upload</span>
          </div>
        )}
        {isUploading ? <div className="cover-uploader__progress">Uploading…</div> : null}
      </div>
      <div className="cover-uploader__actions">
        <button type="button" className="admin-ghost" onClick={handleFileButtonClick} disabled={isUploading}>
          Upload image
        </button>
        <button type="button" className="admin-ghost" onClick={toggleExisting} disabled={isUploading}>
          Choose existing
        </button>
        {hasValue ? (
          <button type="button" className="admin-ghost" onClick={handleRemove} disabled={isUploading}>
            Remove
          </button>
        ) : null}
      </div>
      <div className="cover-uploader__alt">
        <label htmlFor="cover-alt-input">Alt text</label>
        <textarea
          id="cover-alt-input"
          className="cover-uploader__alt-input"
          value={altValue}
          onChange={handleAltChange}
          placeholder="Describe the cover image"
          rows={3}
          disabled={!altIsRequired}
        />
        <div className="cover-uploader__alt-meta">
          <span>{altLength}/{ALT_MAX_LENGTH}</span>
        </div>
      </div>
      {statusMessages.map((message, index) => (
        <p
          key={`cover-status-${index}`}
          className={`admin-status admin-status--${message.variant === "error" ? "error" : "hint"}`}
          role={message.variant === "error" ? "alert" : undefined}
        >
          {message.text}
        </p>
      ))}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_INPUT}
        className="cover-uploader__input"
        onChange={handleFileInputChange}
      />
      {renderOverlay(cropOverlay)}
      {renderOverlay(existingOverlay)}
    </div>
  );
}
