/**
 * Cloudinary API Integration helper module.
 * Supports signed uploads using API Key & Secret, or unsigned uploads using Upload Preset.
 */

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  key: string;
  resource_type: "image" | "video" | "raw" | string;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export function isCloudinaryConfigured(): boolean {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset =
    process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return !!(cloudName && ((apiKey && apiSecret) || uploadPreset));
}

export function isVideoUrl(url: string, type?: string): boolean {
  if (!url) return false;
  if (type === "video") return true;
  return (
    /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url) ||
    url.includes("/video/upload/") ||
    url.includes("resource_type=video")
  );
}

export function getMediaThumbnail(url: string, type?: string): string {
  if (!url) return "";
  if (isVideoUrl(url, type)) {
    if (url.includes("cloudinary.com") && url.includes("/video/upload/")) {
      return url
        .replace("/video/upload/", "/video/upload/so_0,f_jpg,w_800/")
        .replace(/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i, ".jpg");
    }
  }
  return url;
}

async function sha1Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadToCloudinary(
  file: File | Blob,
  fileName?: string,
  options: {
    folder?: string;
    resourceType?: "auto" | "image" | "video";
  } = {}
): Promise<CloudinaryUploadResult> {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset =
    process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME (and CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET or CLOUDINARY_UPLOAD_PRESET) in environment variables."
    );
  }

  const mimeType = file.type || "";
  let resourceType = options.resourceType || "auto";
  if (resourceType === "auto") {
    if (mimeType.startsWith("video/")) {
      resourceType = "video";
    } else if (mimeType.startsWith("image/")) {
      resourceType = "image";
    }
  }

  const folder = options.folder || "an_fitness";
  const formData = new FormData();
  formData.append("file", file, fileName || (file as File).name || "upload");

  if (apiKey && apiSecret) {
    // Signed Upload
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign: Record<string, string> = {
      folder,
      timestamp,
    };

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(paramsToSign).sort();
    const signatureBase =
      sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join("&") + apiSecret;
    const signature = await sha1Hex(signatureBase);

    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
  } else if (uploadPreset) {
    // Unsigned Upload
    formData.append("upload_preset", uploadPreset);
    if (folder) {
      formData.append("folder", folder);
    }
  } else {
    throw new Error(
      "Cloudinary configuration missing authentication: Provide either CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET or CLOUDINARY_UPLOAD_PRESET."
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let parsedErr = "";
    try {
      const jsonErr = JSON.parse(errorText);
      parsedErr = jsonErr.error?.message || errorText;
    } catch {
      parsedErr = errorText;
    }
    throw new Error(`Cloudinary upload failed: ${parsedErr}`);
  }

  const data = await res.json();

  return {
    success: true,
    url: data.secure_url || data.url,
    key: data.public_id || `cloudinary-${Date.now()}`,
    resource_type: data.resource_type || resourceType,
    format: data.format,
    width: data.width,
    height: data.height,
    duration: data.duration,
  };
}
