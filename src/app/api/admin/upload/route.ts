import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getR2 } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { apiError, unauthorizedError, validationError } from "@/lib/api-errors";

export const runtime = "edge";

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

function resolveMediaType(
  fileType: string,
  fileName: string,
  resourceType?: string
): "image" | "video" | "audio" {
  if (fileType.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|oga)$/i.test(fileName)) {
    return "audio";
  }
  if (fileType.startsWith("video/") || resourceType === "video") {
    return "video";
  }
  return "image";
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderHint = (formData.get("folder") as string | null) || "";

    if (!file) {
      return validationError("Please choose a file to upload.");
    }

    const fileType = file.type.toLowerCase();
    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");
    const isAudio = fileType.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|oga)$/i.test(file.name);

    if (!isImage && !isVideo && !isAudio) {
      return validationError(
        "Please upload an image (JPEG, PNG, WEBP, GIF), video (MP4, WEBM, MOV), or audio (MP3, WAV, M4A, OGG, AAC)."
      );
    }

    const folder = folderHint.trim() || "an_fitness/gallery";

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(file, file.name, {
          folder,
          
          resourceType: isAudio || isVideo ? "video" : isImage ? "image" : "auto",
        });

        const type = resolveMediaType(fileType, file.name, result.resource_type);

        return NextResponse.json({
          success: true,
          url: result.url,
          key: result.key,
          resource_type: result.resource_type,
          type,
          width: result.width,
          height: result.height,
          duration: result.duration,
          provider: "cloudinary",
        });
      } catch (cloudinaryErr) {
        console.error("Cloudinary upload failed, attempting fallback:", cloudinaryErr);
      }
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (isImage && imgbbApiKey) {
      const imgbbFormData = new FormData();
      imgbbFormData.append("image", file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: "POST",
        body: imgbbFormData,
      });

      if (response.ok) {
        const resData = (await response.json()) as {
          success?: boolean;
          data?: { url?: string; id?: string };
        };
        if (resData.success && resData.data?.url) {
          return NextResponse.json({
            success: true,
            url: resData.data.url,
            key: resData.data.id || `imgbb-${Date.now()}`,
            type: "image",
            provider: "imgbb",
          });
        }
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const extension =
      file.name.split(".").pop() || (isAudio ? "mp3" : isVideo ? "mp4" : "webp");
    const key = `gallery-${crypto.randomUUID()}.${extension}`;

    const r2 = getR2();
    await r2.put(key, bytes, {
      httpMetadata: { contentType: file.type },
    });

    const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
    const publicUrl = r2PublicDomain
      ? `${r2PublicDomain.replace(/\/$/, "")}/${key}`
      : `/${key}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key,
      type: isAudio ? "audio" : isVideo ? "video" : "image",
      provider: "r2",
    });
  } catch (err) {
    return apiError(err, 500, "Couldn't upload file. Please try again.");
  }
}
