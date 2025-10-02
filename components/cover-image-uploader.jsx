"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const ACCEPT_INPUT = "image/*";
const DEFAULT_ASPECT = 3 / 2;

function sanitizeAlt(value) {
  if (!value) return "";
  const base = value.split("/").pop() || value;
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\.[^.]+$/, "")
    .trim();
}

async function getCroppedBlob(image, crop, fileType) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Crop failed."));
          return;
        }
        resolve(blob);
      },
      fileType || "image/jpeg",
      0.92
    );
  });
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function CoverImageUploader({ value, alt, onChange }) {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const [error, setError] = useState("");
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [isExistingOpen, setIsExistingOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [hasLoadedMedia, setHasLoadedMedia] = useState(false);
  const [portalTarget, setPortalTarget] = useState(() =>
    typeof document !== "undefined" ? document.body : null
  );

  const hasValue = Boolean(value);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setPortalTarget(document.body);
  }, []);

  const handleTriggerFile = useCallback(() => {
    setError("");
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setError("Unsupported file type.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setActiveFile(file);
      setImageSrc(dataUrl);
      setIsCropping(true);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setError("");
    } catch (err) {
      setError(err?.message || "Could not read file.");
    }
  }, []);

  const onImageLoad = useCallback((e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: "%", width: 90 },
        DEFAULT_ASPECT,
        width,
        height
      ),
      width,
      height
    );

    setCrop(initialCrop);
  }, []);

  const renderOverlay = useCallback(
    (node) => {
      if (!node) return null;
      return portalTarget ? createPortal(node, portalTarget) : node;
    },
    [portalTarget]
  );

  const closeCropper = useCallback(() => {
    setIsCropping(false);
    setImageSrc(null);
    setActiveFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!activeFile || !imageSrc || !completedCrop || !imgRef.current) {
      setError("Please adjust the crop before saving.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const blob = await getCroppedBlob(
        imgRef.current,
        completedCrop,
        activeFile.type
      );

      const extension = activeFile.name.includes('.')
        ? `.${activeFile.name.split('.').pop()}`
        : '';
      const uploadFile = new File([blob], `cover${extension || '.jpg'}`, {
        type: blob.type || activeFile.type
      });

      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Upload failed");
      }

      const derivedAlt = sanitizeAlt(activeFile.name);
      onChange?.({ url: payload.url, alt: derivedAlt });

      setMediaItems((prev) => {
        const filtered = Array.isArray(prev)
          ? prev.filter((item) => item.pathname !== payload.pathname)
          : [];
        return [{ ...payload, alt: derivedAlt }, ...filtered];
      });

      setHasLoadedMedia(true);
      closeCropper();
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [activeFile, closeCropper, completedCrop, imageSrc, onChange]);

  const toggleExisting = useCallback(() => {
    setError("");
    setIsExistingOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isExistingOpen || hasLoadedMedia || isLoadingMedia) {
      return;
    }
    let ignore = false;
    setIsLoadingMedia(true);
    (async () => {
      try {
        const res = await fetch("/api/media", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load media");
        if (!ignore) {
          const images = Array.isArray(data.files)
            ? data.files.filter((file) => file.type?.startsWith("image/"))
            : [];
          setMediaItems(images);
          setHasLoadedMedia(true);
        }
      } catch (err) {
        if (!ignore) setError(err?.message || "Failed to load media");
      } finally {
        if (!ignore) setIsLoadingMedia(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [hasLoadedMedia, isExistingOpen, isLoadingMedia]);

  const handleSelectExisting = useCallback(
    (item) => {
      onChange?.({ url: item.url, alt: item.alt || item.title || sanitizeAlt(item.pathname) });
      setIsExistingOpen(false);
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange?.({ url: "", alt: "" });
  }, [onChange]);

  const previewAlt = useMemo(() => {
    if (alt && alt.trim()) return alt;
    if (!value) return "";
    const parts = value.split("/");
    return sanitizeAlt(parts[parts.length - 1]);
  }, [alt, value]);

  return (
    <div className="cover-uploader">
      <div className="cover-uploader__preview">
        {hasValue ? (
          <Image
            src={value}
            alt={previewAlt || "Cover image"}
            fill
            sizes="(max-width: 900px) 100vw, 420px"
            className="cover-uploader__preview-image"
          />
        ) : (
          <div className="cover-uploader__placeholder">No cover image</div>
        )}
      </div>
      <div className="cover-uploader__actions">
        <button type="button" className="admin-ghost" onClick={handleTriggerFile}>
          Upload image
        </button>
        <button type="button" className="admin-ghost" onClick={toggleExisting}>
          Choose existing
        </button>
        {hasValue ? (
          <button type="button" className="admin-ghost" onClick={handleRemove}>
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_INPUT}
        className="cover-uploader__input"
        onChange={handleFileChange}
      />
      {error ? (
        <p className="admin-status admin-status--error" role="alert">
          {error}
        </p>
      ) : null}

      {renderOverlay(
        isCropping ? (
          <div className="cover-uploader__overlay" role="dialog" aria-modal="true">
            <div className="cover-uploader__sheet cover-uploader__sheet--crop">
              <header className="cover-uploader__sheet-header">
                <h2>Crop cover image</h2>
                <button
                  type="button"
                  className="admin-ghost"
                  onClick={closeCropper}
                  disabled={isUploading}
                >
                  Close
                </button>
              </header>
              <div className="cover-uploader__crop-container">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={DEFAULT_ASPECT}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
              <div className="cover-uploader__footer">
                <button type="button" className="admin-ghost" onClick={closeCropper} disabled={isUploading}>
                  Back
                </button>
                <button
                  type="button"
                  className="admin-primary"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading…" : "Save crop"}
                </button>
              </div>
            </div>
          </div>
        )
          : null
      )}

      {renderOverlay(
        isExistingOpen ? (
          <div className="cover-uploader__overlay" role="dialog" aria-modal="true">
            <div className="cover-uploader__sheet cover-uploader__sheet--media">
              <header className="cover-uploader__sheet-header">
                <h2>Select existing image</h2>
                <button type="button" className="admin-ghost" onClick={toggleExisting}>
                  Close
                </button>
              </header>
              <div className="cover-uploader__media-grid">
                {isLoadingMedia ? (
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
                      <span>{item.title || item.alt || sanitizeAlt(item.pathname)}</span>
                    </button>
                  ))
                ) : (
                  <p className="cover-uploader__empty">No images available yet.</p>
                )}
              </div>
            </div>
          </div>
        )
          : null
      )}
    </div>
  );
}