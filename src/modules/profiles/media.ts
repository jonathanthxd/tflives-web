import { ProfileAssetKind } from "@prisma/client";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_DIMENSIONS: Record<ProfileAssetKind, { width: number; height: number }> = {
  AVATAR: { width: 2_048, height: 2_048 },
  BANNER: { width: 4_096, height: 2_160 },
};

export class ProfileMediaError extends Error {}

type ImageDetails = { mimeType: "image/png" | "image/jpeg" | "image/webp"; width: number; height: number };

function readUint16(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readUint32LE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function pngDetails(bytes: Uint8Array): ImageDetails | null {
  if (bytes.length < 24 || !PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) return null;
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return width > 0 && height > 0 ? { mimeType: "image/png", width, height } : null;
}

function jpegDetails(bytes: Uint8Array): ImageDetails | null {
  if (bytes.length < 9 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (offset + 1 >= bytes.length) return null;
    const segmentLength = readUint16(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3 || marker >= 0xc5 && marker <= 0xc7 || marker >= 0xc9 && marker <= 0xcb || marker >= 0xcd && marker <= 0xcf;
    if (isStartOfFrame && segmentLength >= 7) {
      const height = readUint16(bytes, offset + 3);
      const width = readUint16(bytes, offset + 5);
      return width > 0 && height > 0 ? { mimeType: "image/jpeg", width, height } : null;
    }
    offset += segmentLength;
  }
  return null;
}

function webpDetails(bytes: Uint8Array): ImageDetails | null {
  if (
    bytes.length < 30 ||
    String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
    String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP"
  ) return null;
  const kind = String.fromCharCode(...bytes.slice(12, 16));
  if (kind === "VP8X") {
    const width = readUint24LE(bytes, 24) + 1;
    const height = readUint24LE(bytes, 27) + 1;
    return { mimeType: "image/webp", width, height };
  }
  if (kind === "VP8L" && bytes[20] === 0x2f) {
    const packed = readUint32LE(bytes, 21);
    const width = (packed & 0x3fff) + 1;
    const height = ((packed >> 14) & 0x3fff) + 1;
    return { mimeType: "image/webp", width, height };
  }
  if (kind === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    const width = readUint16(bytes, 26) & 0x3fff;
    const height = readUint16(bytes, 28) & 0x3fff;
    return width > 0 && height > 0 ? { mimeType: "image/webp", width, height } : null;
  }
  return null;
}

function imageDetails(bytes: Uint8Array): ImageDetails | null {
  return pngDetails(bytes) ?? jpegDetails(bytes) ?? webpDetails(bytes);
}

export function validateProfileImage(
  bytes: Uint8Array,
  claimedMimeType: string,
  kind: ProfileAssetKind,
): ImageDetails {
  const details = imageDetails(bytes);
  if (!details || details.mimeType !== claimedMimeType) {
    throw new ProfileMediaError("El archivo no coincide con un PNG, JPG o WebP válido");
  }
  const maximum = MAX_DIMENSIONS[kind];
  if (details.width > maximum.width || details.height > maximum.height) {
    throw new ProfileMediaError(
      kind === ProfileAssetKind.AVATAR
        ? "El avatar no puede superar 2048 × 2048 px"
        : "El banner no puede superar 4096 × 2160 px",
    );
  }
  return details;
}
