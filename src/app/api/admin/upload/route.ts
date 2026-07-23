import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getR2 } from "@/lib/db";
import { verifySession } from "@/lib/auth";

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

    
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: "Only image files (JPEG, PNG, WEBP, GIF) are allowed" }, { status: 400 });
    }

        
    const imgbbApiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;

    if (imgbbApiKey) {
      const imgbbFormData = new FormData();
      imgbbFormData.append("image", file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: "POST",
        body: imgbbFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IMGBB upload failed: ${errorText}`);
      }

      const resData = await response.json() as any;
      if (!resData.success) {
        throw new Error(resData.error?.message || "Failed to upload to IMGBB");
      }

      return NextResponse.json({
        success: true,
        url: resData.data.url,
        key: resData.data.id || `imgbb-${Date.now()}`
      });
    }

    
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    
    const extension = file.name.split(".").pop() || "webp";
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
      key: key
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload image" }, { status: 500 });
  }
}
