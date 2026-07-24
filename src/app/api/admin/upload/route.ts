import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getR2 } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "edge";

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileType = file.type.toLowerCase();
    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only image (JPEG, PNG, WEBP, GIF) and video (MP4, WEBM, MOV) files are allowed" },
        { status: 400 }
      );
    }

    // 1. Try Cloudinary first (supports both Images & Videos)
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
      } catch (cloudinaryErr: any) {
        console.error("Cloudinary upload failed, attempting fallback:", cloudinaryErr);
      }
    }

    // 2. Fallback for Images to IMGBB (if available)
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

    // 3. Fallback to Cloudflare R2
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status: 500 });
  }
}
