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

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return validationError("Please choose a file to upload.");
    }

    const fileType = file.type.toLowerCase();
    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");

    if (!isImage && !isVideo) {
      return validationError("Please upload an image (JPEG, PNG, WEBP, GIF) or video (MP4, WEBM, MOV).");
    }

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(file, file.name, {
          folder: "an_fitness/gallery",
          resourceType: isVideo ? "video" : isImage ? "image" : "auto",
        });

        return NextResponse.json({
          success: true,
          url: result.url,
          key: result.key,
          resource_type: result.resource_type,
          type: isVideo || result.resource_type === "video" ? "video" : "image",
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
        const resData = (await response.json()) as any;
        if (resData.success) {
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

    const extension = file.name.split(".").pop() || (isVideo ? "mp4" : "webp");
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
      type: isVideo ? "video" : "image",
      provider: "r2",
    });
  } catch (err) {
    return apiError(err, 500, "Couldn't upload file. Please try again.");
  }
}
