import { mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const COVER_ROUTE = '/generated/vehicle-covers';
const GALLERY_ROUTE = '/generated/vehicle-gallery';
const STATIC_IMAGE_ROUTE = '/generated/static-images';
const COVER_WIDTH = 960;
const GALLERY_WIDTH = 1400;
const STATIC_IMAGE_WIDTH = 1400;
const COVER_QUALITY = 68;
const DOWNLOAD_TIMEOUT_MS = 15000;

function safeFileName(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isVehicleImageMedia(file) {
  return Boolean(
    file &&
      typeof file === 'object' &&
      file.fileUrl &&
      file.category === 'vehicle_photos' &&
      (!file.mimeType || String(file.mimeType).startsWith('image/'))
  );
}

export function getVehicleCoverSource(vehicle) {
  const refs = vehicle?.external_refs && typeof vehicle.external_refs === 'object'
    ? vehicle.external_refs
    : {};
  const firstMediaImage = Array.isArray(refs.mediaFiles)
    ? refs.mediaFiles.find(isVehicleImageMedia)?.fileUrl
    : '';

  return refs.coverImageUrl || refs.vehiclePhotoUrl || refs.imageUrl || firstMediaImage || '';
}

export function getVehicleGallerySources(vehicle) {
  const refs = vehicle?.external_refs && typeof vehicle.external_refs === 'object'
    ? vehicle.external_refs
    : {};
  const mediaFiles = Array.isArray(refs.mediaFiles) ? refs.mediaFiles : [];
  const seen = new Set();

  return mediaFiles
    .filter(isVehicleImageMedia)
    .map((file) => ({
      file,
      sourceUrl: String(file.fileUrl || '').trim(),
    }))
    .filter(({ sourceUrl }) => {
      if (!sourceUrl || seen.has(sourceUrl)) return false;
      seen.add(sourceUrl);
      return true;
    });
}

export function vehicleCoverCacheUrl(vehicle) {
  const fileName = safeFileName(vehicle?.id);
  return fileName ? `${COVER_ROUTE}/${fileName}.webp` : '';
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function cacheVehicleCoverImages(vehicles, outputRoot, options = {}) {
  const loggerPrefix = options.loggerPrefix || 'vehicle-cover-cache';
  const coverDir = path.join(outputRoot, 'generated', 'vehicle-covers');
  const coverUrls = new Map();
  let generated = 0;
  let reused = 0;
  let skipped = 0;
  let failed = 0;

  await mkdir(coverDir, { recursive: true });

  for (const vehicle of vehicles || []) {
    const sourceUrl = getVehicleCoverSource(vehicle);
    const cacheUrl = vehicleCoverCacheUrl(vehicle);

    if (!sourceUrl || !cacheUrl) {
      skipped += 1;
      continue;
    }

    const filePath = path.join(coverDir, path.basename(cacheUrl));

    try {
      const existing = await stat(filePath).catch(() => null);
      if (existing?.size > 0) {
        coverUrls.set(String(vehicle.id), cacheUrl);
        reused += 1;
        continue;
      }

      const response = await fetchWithTimeout(sourceUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const input = Buffer.from(await response.arrayBuffer());
      await sharp(input)
        .rotate()
        .resize({ width: COVER_WIDTH, withoutEnlargement: true })
        .webp({ quality: COVER_QUALITY, effort: 4 })
        .toFile(filePath);

      coverUrls.set(String(vehicle.id), cacheUrl);
      generated += 1;
    } catch (error) {
      failed += 1;
      console.warn(`[${loggerPrefix}] Could not cache cover for ${vehicle?.id || 'unknown'}: ${error.message}`);
    }
  }

  console.log(
    `[${loggerPrefix}] Vehicle covers: ${generated} generated, ${reused} reused, ${skipped} skipped, ${failed} failed`,
  );

  return coverUrls;
}

export async function cacheVehicleGalleryImages(vehicles, outputRoot, options = {}) {
  const loggerPrefix = options.loggerPrefix || 'vehicle-gallery-cache';
  const galleryDir = path.join(outputRoot, 'generated', 'vehicle-gallery');
  const galleryUrls = new Map();
  let generated = 0;
  let reused = 0;
  let skipped = 0;
  let failed = 0;

  await mkdir(galleryDir, { recursive: true });

  for (const vehicle of vehicles || []) {
    const vehicleId = String(vehicle?.id || '');
    const vehiclePrefix = safeFileName(vehicleId);
    const coverSource = String(getVehicleCoverSource(vehicle) || '').trim();
    const sources = getVehicleGallerySources(vehicle).filter(
      ({ sourceUrl }) => sourceUrl !== coverSource,
    );
    const mediaFiles = [];

    if (!vehicleId || !vehiclePrefix || sources.length === 0) {
      skipped += 1;
      continue;
    }

    for (const { sourceUrl } of sources) {
      const fileName = `${vehiclePrefix}-${cacheFileNameForUrl(sourceUrl)}`;
      const cacheUrl = `${GALLERY_ROUTE}/${fileName}`;
      const filePath = path.join(galleryDir, fileName);

      try {
        const existing = await stat(filePath).catch(() => null);
        if (!existing?.size) {
          const response = await fetchWithTimeout(sourceUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const input = Buffer.from(await response.arrayBuffer());
          await sharp(input)
            .rotate()
            .resize({ width: options.width || GALLERY_WIDTH, withoutEnlargement: true })
            .webp({ quality: options.quality || COVER_QUALITY, effort: 4 })
            .toFile(filePath);

          generated += 1;
        } else {
          reused += 1;
        }

        mediaFiles.push({
          category: 'vehicle_photos',
          fileUrl: cacheUrl,
          mimeType: 'image/webp',
        });
      } catch (error) {
        failed += 1;
        console.warn(`[${loggerPrefix}] Could not cache gallery image for ${vehicleId}: ${error.message}`);
      }
    }

    if (mediaFiles.length > 0) {
      galleryUrls.set(vehicleId, mediaFiles);
    }
  }

  console.log(
    `[${loggerPrefix}] Vehicle gallery images: ${generated} generated, ${reused} reused, ${skipped} skipped, ${failed} failed`,
  );

  return galleryUrls;
}

function cacheFileNameForUrl(url) {
  return `${createHash('sha1').update(url).digest('hex').slice(0, 16)}.webp`;
}

function isSupabaseStorageImageUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith('.supabase.co') &&
      /\/storage\/v1\/(?:object|render)\//.test(parsed.pathname) &&
      /\.(?:jpe?g|png|webp)$/i.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export async function cacheStaticImageUrls(imageUrls, outputRoot, options = {}) {
  const loggerPrefix = options.loggerPrefix || 'static-image-cache';
  const imageDir = path.join(outputRoot, 'generated', 'static-images');
  const cachedUrls = new Map();
  const uniqueUrls = Array.from(new Set((imageUrls || []).filter(isSupabaseStorageImageUrl)));
  let generated = 0;
  let reused = 0;
  let failed = 0;

  await mkdir(imageDir, { recursive: true });

  for (const sourceUrl of uniqueUrls) {
    const cacheUrl = `${STATIC_IMAGE_ROUTE}/${cacheFileNameForUrl(sourceUrl)}`;
    const filePath = path.join(imageDir, path.basename(cacheUrl));

    try {
      const existing = await stat(filePath).catch(() => null);
      if (existing?.size > 0) {
        cachedUrls.set(sourceUrl, cacheUrl);
        reused += 1;
        continue;
      }

      const response = await fetchWithTimeout(sourceUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const input = Buffer.from(await response.arrayBuffer());
      await sharp(input)
        .rotate()
        .resize({ width: options.width || STATIC_IMAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: options.quality || COVER_QUALITY, effort: 4 })
        .toFile(filePath);

      cachedUrls.set(sourceUrl, cacheUrl);
      generated += 1;
    } catch (error) {
      failed += 1;
      console.warn(`[${loggerPrefix}] Could not cache image ${sourceUrl}: ${error.message}`);
    }
  }

  console.log(
    `[${loggerPrefix}] Static images: ${generated} generated, ${reused} reused, ${failed} failed`,
  );

  return cachedUrls;
}
