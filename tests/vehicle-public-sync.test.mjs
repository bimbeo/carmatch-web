import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isAllowedPublicVehicleImageUrl,
  pruneExternalRefs,
  resolveVehicleImageSource,
} from '../api/vehicles.js';

const vehicleId = '5e55fb77-5c0c-4111-a80f-85fd62a6c15b';
const projectUrl = 'https://example.supabase.co';
const coverUrl = `${projectUrl}/storage/v1/object/public/vehicle-photos/company/${vehicleId}/cover.jpg`;
const galleryUrl = `${projectUrl}/storage/v1/object/public/vehicle-media/company/${vehicleId}/vehicle_photos/one.jpg`;

test('public vehicle payload uses same-origin versioned image proxy URLs', () => {
  const refs = pruneExternalRefs(vehicleId, {
    coverImageUrl: coverUrl,
    vehiclePhotoUpdatedAt: '2026-08-03T09:27:42.641Z',
    secret_internal_note: 'must not leak',
    mediaFiles: [
      {
        id: 'media-1',
        category: 'vehicle_photos',
        fileUrl: galleryUrl,
        mimeType: 'image/jpeg',
        uploadedAt: '2026-08-03T09:28:08.774Z',
      },
      { id: 'document-1', category: 'registration', fileUrl: 'https://private.example/doc.pdf' },
    ],
  }, '2026-08-03T09:28:08.774Z');

  assert.match(refs.coverImageUrl, /^\/api\/vehicles\?/);
  assert.match(refs.coverImageUrl, /vehicleId=5e55fb77-5c0c-4111-a80f-85fd62a6c15b/);
  assert.match(refs.coverImageUrl, /v=2026-08-03T09%3A27%3A42.641Z/);
  assert.equal(refs.mediaFiles.length, 1);
  assert.match(refs.mediaFiles[0].fileUrl, /mediaId=media-1/);
  assert.equal('secret_internal_note' in refs, false);
  assert.equal(JSON.stringify(refs).includes('supabase.co'), false);
});

test('public vehicle image URL falls back to the vehicle update timestamp', () => {
  const refs = pruneExternalRefs(
    vehicleId,
    { coverImageUrl: coverUrl },
    '2026-08-03T09:28:08.774Z',
  );

  assert.match(refs.coverImageUrl, /v=2026-08-03T09%3A28%3A08.774Z/);
});

test('vehicle image source resolves cover and selected gallery media', () => {
  const refs = {
    coverImageUrl: coverUrl,
    mediaFiles: [
      { id: 'media-1', category: 'vehicle_photos', fileUrl: galleryUrl, mimeType: 'image/jpeg' },
    ],
  };

  assert.equal(resolveVehicleImageSource(refs), coverUrl);
  assert.equal(resolveVehicleImageSource(refs, 'media-1'), galleryUrl);
  assert.equal(resolveVehicleImageSource(refs, 'missing'), '');
});

test('vehicle image proxy only accepts public image buckets from configured Supabase project', () => {
  assert.equal(isAllowedPublicVehicleImageUrl(coverUrl, projectUrl), true);
  assert.equal(isAllowedPublicVehicleImageUrl(galleryUrl, projectUrl), true);
  assert.equal(
    isAllowedPublicVehicleImageUrl(`${projectUrl}/storage/v1/object/sign/vehicle-photos/private.jpg`, projectUrl),
    false,
  );
  assert.equal(
    isAllowedPublicVehicleImageUrl('https://attacker.example/storage/v1/object/public/vehicle-photos/a.jpg', projectUrl),
    false,
  );
  assert.equal(isAllowedPublicVehicleImageUrl('javascript:alert(1)', projectUrl), false);
});
