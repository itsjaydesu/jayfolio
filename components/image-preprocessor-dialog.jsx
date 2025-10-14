"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  buildFileNameFromAlt,
  computeCropResolution,
  createCroppedBlob,
  readFileAsDataUrl,
  sanitizeAlt
} from "./uploader-utils";

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MIN_WIDTH = 640;
const QUALITY_MIN = 0.5;
const QUALITY_MAX = 0.95;

function inferExtension(mimeType, fallbackExtension) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return fallbackExtension || ".jpg";
  }
}

export default function ImagePreprocessorDialog({ file, onConfirm, onSkip, onCancel }) {
  const imgRef = useRef(null);
  const hasInitializedWidthRef = useRef(false);
  const hasTouchedWidthRef = useRef(false);

  const [imageSrc, setImageSrc] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [cropResolution, setCropResolution] = useState({ width: 0, height: 0 });
  const [outputWidth, setOutputWidth] = useState(null);

  const supportsQuality = useMemo(() => {
    const type = file?.type || "";
    return type === "image/jpeg" || type === "image/webp";
  }, [file]);

  const [quality, setQuality] = useState(() => (supportsQuality ? 0.82 : 1));

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropResolution({ width: 0, height: 0 });
    setOutputWidth(null);
    hasInitializedWidthRef.current = false;
    hasTouchedWidthRef.current = false;

    readFileAsDataUrl(file)
      .then((url) => {
        if (!cancelled) {
          setImageSrc(url);
          setIsLoading(false);
        }
      })
      .catch((readError) => {
        if (!cancelled) {
          setError(readError?.message || "Could not read file.");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!supportsQuality) {
      setQuality(1);
    } else {
      setQuality((current) => (current === 1 ? 0.82 : current));
    }
  }, [supportsQuality]);

  useEffect(() => {
    if (!completedCrop || !imgRef.current) {
      setCropResolution({ width: 0, height: 0 });
      return;
    }
    setCropResolution(computeCropResolution(completedCrop, imgRef.current));
  }, [completedCrop]);

  useEffect(() => {
    if (!cropResolution.width) {
      return;
    }

    setOutputWidth((previous) => {
      const maxAvailable = cropResolution.width;
      if (!hasInitializedWidthRef.current) {
        hasInitializedWidthRef.current = true;
        return Math.min(DEFAULT_MAX_WIDTH, maxAvailable);
      }
      if (hasTouchedWidthRef.current) {
        return Math.min(previous || maxAvailable, maxAvailable);
      }
      return Math.min(previous || maxAvailable, maxAvailable);
    });
  }, [cropResolution.width]);

  const handleImageLoad = useCallback((event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) {
      setError("Could not load image preview.");
      return;
    }
    const initialCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }, []);

  const handleCropChange = useCallback((nextCrop) => {
    setCrop(nextCrop);
  }, []);

  const handleCropComplete = useCallback((nextCrop) => {
    setCompletedCrop(nextCrop);
  }, []);

  const handleWidthChange = useCallback((event) => {
    hasTouchedWidthRef.current = true;
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }
    setOutputWidth(nextValue);
  }, []);

  const handleQualityChange = useCallback((event) => {
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue)) {
      return;
    }
    setQuality(Math.min(QUALITY_MAX, Math.max(QUALITY_MIN, nextValue)));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file) {
      setError("File unavailable.");
      return;
    }
    if (!completedCrop || !imgRef.current) {
      setError("Adjust the crop before continuing.");
      return;
    }
    if (!cropResolution.width || !cropResolution.height) {
      setError("Crop area is too small.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const desiredWidth = outputWidth && outputWidth > 0
        ? Math.min(outputWidth, cropResolution.width)
        : cropResolution.width;

      const options = {};
      if (desiredWidth && desiredWidth < cropResolution.width) {
        options.maxWidth = desiredWidth;
      }

      const sourceName = typeof file.name === "string" ? file.name : "inline-media";
      const fallbackExtension = sourceName.includes(".")
        ? `.${sourceName.split(".").pop()?.toLowerCase()}`
        : "";
      const preferredType = file.type && file.type.startsWith("image/")
        ? file.type
        : "image/jpeg";
      options.mimeType = preferredType;

      const blob = await createCroppedBlob(
        imgRef.current,
        completedCrop,
        preferredType,
        supportsQuality ? quality : 1,
        options
      );

      const extension = inferExtension(blob.type || preferredType, fallbackExtension);
      const baseAlt = sanitizeAlt(sourceName) || "inline-media";
      const fileName = buildFileNameFromAlt(baseAlt, "inline-media", extension);
      const processedFile = new File([blob], fileName, { type: blob.type || preferredType });

      onConfirm?.(processedFile);
    } catch (processingError) {
      setError(processingError?.message || "Failed to prepare image.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    completedCrop,
    cropResolution.height,
    cropResolution.width,
    file,
    onConfirm,
    outputWidth,
    quality,
    supportsQuality
  ]);

  const handleSkip = useCallback(() => {
    if (!file) {
      return;
    }
    onSkip?.(file);
  }, [file, onSkip]);

  const sliderLimits = useMemo(() => {
    if (!cropResolution.width) {
      return { min: 0, max: 0 };
    }
    const max = cropResolution.width;
    const min = Math.min(max, DEFAULT_MIN_WIDTH);
    return { min, max };
  }, [cropResolution.width]);

  return (
    <div className="cover-uploader__overlay" role="dialog" aria-modal="true" aria-label="Prepare image before upload">
      <div className="cover-uploader__sheet cover-uploader__sheet--crop">
        <header className="cover-uploader__sheet-header">
          <h2>Prepare image</h2>
          <button type="button" className="admin-ghost" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </button>
        </header>
        <div className="cover-uploader__crop-container">
          {isLoading ? (
            <p className="cover-uploader__empty">Loading preview…</p>
          ) : imageSrc ? (
            <ReactCrop crop={crop} onChange={handleCropChange} onComplete={handleCropComplete} keepSelection>
              <img ref={imgRef} src={imageSrc} alt="Upload preview" onLoad={handleImageLoad} className="cover-uploader__crop-image" />
            </ReactCrop>
          ) : (
            <p className="cover-uploader__empty">Preview unavailable.</p>
          )}
        </div>
        <div className="cover-uploader__crop-controls">
          <label className="cover-uploader__zoom">
            <span>Output width</span>
            <input
              type="range"
              min={Math.max(1, sliderLimits.min)}
              max={Math.max(1, sliderLimits.max)}
              step={10}
              disabled={sliderLimits.max <= sliderLimits.min || isProcessing}
              value={outputWidth ? Math.min(outputWidth, sliderLimits.max || 1) : sliderLimits.max || 1}
              onChange={handleWidthChange}
            />
            <span className="cover-uploader__zoom-value">
              {outputWidth ? Math.min(outputWidth, sliderLimits.max || 0) : sliderLimits.max || 0}
              px
            </span>
          </label>
          <div className="cover-uploader__resolution">
            Resolution: {cropResolution.width && cropResolution.height ? `${cropResolution.width} × ${cropResolution.height}px` : "—"}
          </div>
          {supportsQuality ? (
            <label className="cover-uploader__zoom">
              <span>JPEG quality</span>
              <input
                type="range"
                min={QUALITY_MIN}
                max={QUALITY_MAX}
                step={0.01}
                value={quality}
                onChange={handleQualityChange}
                disabled={isProcessing}
              />
              <span className="cover-uploader__zoom-value">{Math.round(quality * 100)}%</span>
            </label>
          ) : null}
        </div>
        {error ? (
          <p className="admin-status admin-status--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="cover-uploader__footer">
          <button type="button" className="admin-ghost" onClick={handleSkip} disabled={isProcessing}>
            Use original
          </button>
          <button type="button" className="admin-primary" onClick={handleConfirm} disabled={isProcessing || isLoading}>
            {isProcessing ? "Preparing…" : "Save & upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
