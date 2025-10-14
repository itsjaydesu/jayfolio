import test from 'node:test';
import assert from 'node:assert/strict';

import { createFileSignature } from '../components/use-uploader.js';
import { sanitizeAlt, computeCropResolution } from '../components/uploader-utils.js';

test('createFileSignature produces stable identifiers for identical files', () => {
  const fileA = { name: 'example.png', size: 1024, type: 'image/png', lastModified: 1700000000000 };
  const fileB = { name: 'example.png', size: 1024, type: 'image/png', lastModified: 1700000000000 };

  const signatureA = createFileSignature(fileA);
  const signatureB = createFileSignature(fileB);

  assert.equal(signatureA, signatureB);
});

test('createFileSignature differs when critical metadata changes', () => {
  const base = { name: 'clip.wav', size: 2048, type: 'audio/wav', lastModified: 1700000000000 };
  const variant = { ...base, size: 4096 };

  const baseSignature = createFileSignature(base);
  const variantSignature = createFileSignature(variant);

  assert.notEqual(baseSignature, variantSignature);
});

test('sanitizeAlt trims separators and limits repeated whitespace', () => {
  const raw = '  cover_image--v2_final.JPG  ';
  const expected = 'cover image v2 final';
  assert.equal(sanitizeAlt(raw), expected);
});

test('computeCropResolution scales crop dimensions to intrinsic resolution', () => {
  const crop = { width: 320, height: 240, x: 80, y: 60, unit: 'px' };
  const image = { naturalWidth: 4000, naturalHeight: 3000, width: 800, height: 600 };

  const { width, height } = computeCropResolution(crop, image);

  assert.equal(width, 1600);
  assert.equal(height, 1200);
});
