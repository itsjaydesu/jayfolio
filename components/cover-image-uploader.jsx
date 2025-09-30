"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = src;
  });
}

async function getCroppedBlob(imageSrc, croppedAreaPixels, fileType) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = croppedAreaPixels.width * pixelRatio;
  canvas.height = croppedAreaPixels.height * pixelRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
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
  const [error, setError] = useState("");
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.4);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isExistingOpen, setIsExistingOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [hasLoadedMedia, setHasLoadedMedia] = useState(false);

  const hasValue = Boolean(value);

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
      setZoom(1.4);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setError("");
    } catch (err) {
      setError(err?.message || "Could not read file.");
    }
  }, []);

  const handleCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const closeCropper = useCallback(() => {
    setIsCropping(false);
    setImageSrc(null);
    setActiveFile(null);
    setCroppedAreaPixels(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!activeFile || !imageSrc || !croppedAreaPixels) return;
    try {
      setIsUploading(true);
      setError("");
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, activeFile.type);
      const extension = activeFile.name.includes('.')
        ? `.${activeFile.name.split('.').pop()}`
        : '';
      const uploadFile = new File([blob], `cover${extension || ".jpg"}`, { type: blob.type || activeFile.type });
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
  }, [activeFile, closeCropper, croppedAreaPixels, imageSrc, onChange]);

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
          <img src={value} alt={previewAlt || "Cover image"} />
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

      {isCropping ? (
        <div className="cover-uploader__overlay" role="dialog" aria-modal="true">
          <div className="cover-uploader__sheet">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={DEFAULT_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              classes={{ containerClassName: "cover-uploader__crop" }}
            />
            <div className="cover-uploader__controls">
              <label htmlFor="cover-zoom">Zoom</label>
              <input
                id="cover-zoom"
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </div>
            <div className="cover-uploader__footer">
              <button type="button" className="admin-ghost" onClick={closeCropper} disabled={isUploading}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary"
                onClick={handleUpload}
                disabled={isUploading || !croppedAreaPixels}
              >
                {isUploading ? "Uploading…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isExistingOpen ? (
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
                    <img src={item.url} alt={item.alt || item.title || "Media option"} />
                    <span>{item.title || item.alt || sanitizeAlt(item.pathname)}</span>
                  </button>
                ))
              ) : (
                <p className="cover-uploader__empty">No images available yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
