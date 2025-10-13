'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

const DEFAULT_ACCEPT_PREFIXES = ['image/', 'video/', 'audio/'];
const DEFAULT_ACCEPT_TYPES = new Set([
  'application/zip',
  'application/pdf',
  'application/json',
  'text/plain',
  'text/markdown'
]);
const DEFAULT_ACCEPT_EXTENSIONS = ['.zip', '.pdf', '.txt', '.md', '.json'];
const DEFAULT_MAX_SIZE = 25 * 1024 * 1024;
const DEFAULT_MAX_FILES = 6;

export function createFileSignature(file) {
  if (!file) return '';
  const name = typeof file.name === 'string' ? file.name : 'unknown';
  const size = Number.isFinite(file.size) ? file.size : 0;
  const type = typeof file.type === 'string' ? file.type : '';
  const lastModified = Number.isFinite(file.lastModified) ? file.lastModified : 0;
  return `${name}::${size}::${type}::${lastModified}`;
}

function defaultValidate(file, config) {
  if (!(file instanceof File)) {
    return 'Only file uploads are supported.';
  }
  if (file.size > config.maxFileSize) {
    const limitMb = Math.floor(config.maxFileSize / (1024 * 1024));
    return `"${file.name}" exceeds the ${limitMb}MB upload limit.`;
  }

  const type = file.type || '';
  if (config.acceptedMimePrefixes.some((prefix) => type.startsWith(prefix))) {
    return null;
  }
  if (config.acceptedMimeTypes.has(type)) {
    return null;
  }

  const lowerName = file.name?.toLowerCase?.() ?? '';
  if (config.acceptedExtensions.some((extension) => lowerName.endsWith(extension))) {
    return null;
  }

  return `"${file.name}" is not an accepted file type.`;
}

function createFileEntry(file) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    file,
    signature: createFileSignature(file),
    status: 'pending',
    progress: 0,
    error: null,
    response: null,
    startedAt: null,
    completedAt: null
  };
}

const INITIAL_STATE = {
  files: [],
  status: 'idle',
  error: null,
  duplicates: [],
  rejected: [],
  limited: 0,
  lastCompleted: null
};

function uploaderReducer(state, action) {
  switch (action.type) {
    case 'ENQUEUE': {
      const nextFiles = [...state.files, ...action.entries];
      const duplicates = action.duplicates?.length
        ? [...state.duplicates, ...action.duplicates]
        : state.duplicates;
      const rejected = action.rejected?.length ? [...state.rejected, ...action.rejected] : state.rejected;
      const limited = state.limited + (action.limited || 0);
      return {
        ...state,
        files: nextFiles,
        status: 'queued',
        duplicates,
        rejected,
        limited
      };
    }
    case 'START': {
      const files = state.files.map((entry) =>
        entry.id === action.id
          ? {
              ...entry,
              status: 'uploading',
              startedAt: Date.now(),
              progress: 0,
              error: null
            }
          : entry
      );
      return { ...state, files, status: 'uploading' };
    }
    case 'PROGRESS': {
      const files = state.files.map((entry) =>
        entry.id === action.id
          ? {
              ...entry,
              progress: Math.max(0, Math.min(1, action.progress ?? 0))
            }
          : entry
      );
      return { ...state, files };
    }
    case 'SUCCESS': {
      const files = state.files.map((entry) =>
        entry.id === action.id
          ? {
              ...entry,
              status: 'success',
              progress: 1,
              completedAt: Date.now(),
              response: action.response,
              error: null
            }
          : entry
      );
      return {
        ...state,
        files,
        status: 'uploading',
        lastCompleted: {
          id: action.id,
          response: action.response
        }
      };
    }
    case 'ERROR': {
      const files = state.files.map((entry) =>
        entry.id === action.id
          ? {
              ...entry,
              status: 'error',
              completedAt: Date.now(),
              error: action.error instanceof Error ? action.error.message : action.error || 'Upload failed.'
            }
          : entry
      );
      return {
        ...state,
        files,
        status: 'error',
        error: action.error instanceof Error ? action.error : new Error(action.error || 'Upload failed.')
      };
    }
    case 'CANCELLED': {
      const files = state.files.map((entry) =>
        entry.id === action.id
          ? {
              ...entry,
              status: 'cancelled',
              completedAt: Date.now()
            }
          : entry
      );
      return { ...state, files };
    }
    case 'COMPLETE_BATCH': {
      const hasUploading = state.files.some((entry) => entry.status === 'uploading' || entry.status === 'pending');
      return {
        ...state,
        status: hasUploading ? 'uploading' : 'idle'
      };
    }
    case 'RESET_WARNINGS': {
      return {
        ...state,
        duplicates: [],
        rejected: [],
        limited: 0
      };
    }
    case 'RESET': {
      return INITIAL_STATE;
    }
    default:
      return state;
  }
}

function normalizeOptions(options) {
  const {
    maxFileSize = DEFAULT_MAX_SIZE,
    maxFilesPerBatch = DEFAULT_MAX_FILES,
    acceptedMimePrefixes = DEFAULT_ACCEPT_PREFIXES,
    acceptedMimeTypes = DEFAULT_ACCEPT_TYPES,
    acceptedExtensions = DEFAULT_ACCEPT_EXTENSIONS,
    validateFile = null,
    dedupe = true,
    requestUpload,
    normalizeResponse,
    onFileStart,
    onFileProgress,
    onFileSuccess,
    onFileError,
    onFileCancel
  } = options || {};

  if (typeof requestUpload !== 'function') {
    throw new Error('useUploader requires a requestUpload implementation.');
  }

  return {
    maxFileSize,
    maxFilesPerBatch: Math.max(1, maxFilesPerBatch),
    acceptedMimePrefixes,
    acceptedMimeTypes,
    acceptedExtensions,
    validateFile,
    dedupe,
    requestUpload,
    normalizeResponse,
    onFileStart,
    onFileProgress,
    onFileSuccess,
    onFileError,
    onFileCancel
  };
}

export function useUploader(options) {
  const config = useMemo(() => normalizeOptions(options || {}), [options]);
  const [state, dispatch] = useReducer(uploaderReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  const controllersRef = useRef(new Map());
  const runningRef = useRef(Promise.resolve());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearWarnings = useCallback(() => {
    dispatch({ type: 'RESET_WARNINGS' });
  }, []);

  const reset = useCallback(() => {
    controllersRef.current.forEach((controller) => {
      try {
        controller.abort();
      } catch (abortError) {
        console.warn('[useUploader] abort failed during reset', abortError);
      }
    });
    controllersRef.current.clear();
    dispatch({ type: 'RESET' });
  }, []);

  const cancelUpload = useCallback((id) => {
    const controller = controllersRef.current.get(id);
    if (!controller) return;
    controller.abort();
    controllersRef.current.delete(id);
    dispatch({ type: 'CANCELLED', id });
  }, []);

  const cancelAll = useCallback(() => {
    const controllers = Array.from(controllersRef.current.values());
    controllers.forEach((controller) => {
      try {
        controller.abort();
      } catch (abortError) {
        console.warn('[useUploader] cancelAll abort failed', abortError);
      }
    });
    controllersRef.current.clear();
  }, []);

  const runBatch = useCallback(
    async (entries, metadata) => {
      const results = [];
      for (const entry of entries) {
        dispatch({ type: 'START', id: entry.id });
        config.onFileStart?.(entry.file, entry.id);

        const controller = new AbortController();
        controllersRef.current.set(entry.id, controller);

        try {
          const response = await config.requestUpload({
            file: entry.file,
            signal: controller.signal,
            metadata,
            onProgress: (value) => {
              dispatch({ type: 'PROGRESS', id: entry.id, progress: value ?? 0 });
              config.onFileProgress?.(entry.file, value ?? 0, entry.id);
            }
          });

          const normalized = config.normalizeResponse
            ? config.normalizeResponse(response, entry.file)
            : response;

          controllersRef.current.delete(entry.id);
          dispatch({ type: 'SUCCESS', id: entry.id, response: normalized });
          config.onFileSuccess?.(normalized, entry.file, entry.id);
          results.push({ id: entry.id, file: entry.file, response: normalized });
        } catch (error) {
          controllersRef.current.delete(entry.id);
          if (error?.name === 'AbortError') {
            dispatch({ type: 'CANCELLED', id: entry.id });
            config.onFileCancel?.(entry.file, entry.id);
            results.push({ id: entry.id, file: entry.file, error, cancelled: true });
            continue;
          }

          const finalError = error instanceof Error ? error : new Error(error || 'Upload failed');
          dispatch({ type: 'ERROR', id: entry.id, error: finalError });
          config.onFileError?.(finalError, entry.file, entry.id);
          results.push({ id: entry.id, file: entry.file, error: finalError });
        }
      }

      dispatch({ type: 'COMPLETE_BATCH' });
      return results;
    },
    [config]
  );

  const uploadFiles = useCallback(
    (inputFiles, metadata) => {
      const incoming = Array.from(inputFiles ?? []).filter(Boolean);
      if (!incoming.length) {
        return Promise.resolve({ entries: [], results: [], duplicates: [], rejected: [], limited: 0 });
      }

      const currentState = stateRef.current;
      const existingSignatures = new Set(currentState.files.map((entry) => entry.signature));
      const activeCount = currentState.files.filter((entry) => entry.status === 'pending' || entry.status === 'uploading').length;
      const availableSlots = Math.max(config.maxFilesPerBatch - activeCount, 0);

      const entries = [];
      const duplicates = [];
      const rejected = [];
      let limited = 0;

      for (const file of incoming) {
        if (entries.length >= availableSlots) {
          limited += 1;
          continue;
        }

        const validationError = config.validateFile
          ? config.validateFile(file, config)
          : defaultValidate(file, config);

        if (validationError) {
          rejected.push({ file, reason: validationError });
          continue;
        }

        const signature = createFileSignature(file);
        if (config.dedupe && existingSignatures.has(signature)) {
          duplicates.push({ file, reason: 'Duplicate file skipped' });
          continue;
        }

        const entry = createFileEntry(file);
        entry.signature = signature;
        entries.push(entry);
        existingSignatures.add(signature);
      }

      if (!entries.length) {
        dispatch({
          type: 'ENQUEUE',
          entries: [],
          duplicates,
          rejected,
          limited
        });
        return Promise.resolve({ entries: [], results: [], duplicates, rejected, limited });
      }

      dispatch({
        type: 'ENQUEUE',
        entries,
        duplicates,
        rejected,
        limited
      });

      runningRef.current = runningRef.current.then(() => runBatch(entries, metadata));

      return runningRef.current.then((results) => ({
        entries,
        results,
        duplicates,
        rejected,
        limited
      }));
    },
    [config, runBatch]
  );

  return {
    state,
    uploadFiles,
    cancelUpload,
    cancelAll,
    reset,
    clearWarnings
  };
}
