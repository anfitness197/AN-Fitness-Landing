
const IMAGE_MAX_W = 1600;
const IMAGE_MAX_H = 1200;
const IMAGE_QUALITY = 0.82;

export const VIDEO_MAX_UPLOAD_BYTES = 90 * 1024 * 1024;

function baseName(file: File) {
  return file.name.replace(/\.[^/.]+$/, "") || "media";
}

export async function compressImageToWebp(file: File): Promise<File> {
  if (file.type === "image/webp" && file.size < 400_000) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't load image"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > IMAGE_MAX_W || height > IMAGE_MAX_H) {
          const ratio = Math.min(IMAGE_MAX_W / width, IMAGE_MAX_H / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("WebP conversion failed"));
              return;
            }
            
            if (blob.size >= file.size && file.type.startsWith("image/")) {
              resolve(file);
              return;
            }
            resolve(
              new File([blob], `${baseName(file)}.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              })
            );
          },
          "image/webp",
          IMAGE_QUALITY
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
