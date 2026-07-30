

const IMAGE_MAX_W = 1600;
const IMAGE_MAX_H = 1200;
const IMAGE_QUALITY = 0.82;

const VIDEO_MAX_W = 1280;
const VIDEO_BITRATE = 2_500_000; 
const VIDEO_MAX_DURATION_SEC = 180;

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

function pickWebmMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

export async function convertVideoToWebm(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (file.type === "video/webm" && file.size < 6 * 1024 * 1024) return file;

  const mime = pickWebmMime();
  if (!mime) return file;

  const videoEl = document.createElement("video");
  videoEl.playsInline = true;
  videoEl.muted = true; 
  videoEl.preload = "auto";

  const objectUrl = URL.createObjectURL(file);
  videoEl.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      videoEl.onloadedmetadata = () => resolve();
      videoEl.onerror = () => reject(new Error("Couldn't read video"));
      
      setTimeout(() => reject(new Error("Video load timeout")), 20000);
    });

    const duration = videoEl.duration;
    if (!Number.isFinite(duration) || duration <= 0) return file;
    if (duration > VIDEO_MAX_DURATION_SEC) {
      
      return file;
    }

    
    
    const anyVideo = videoEl as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const capture = anyVideo.captureStream || anyVideo.mozCaptureStream;
    if (!capture) return file;

    
    videoEl.muted = false;
    const stream = capture.call(videoEl);
    videoEl.muted = true;

    if (!stream.getVideoTracks().length) return file;

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: VIDEO_BITRATE,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const stopped = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      recorder.onerror = () => reject(new Error("Recording failed"));
    });

    recorder.start(250);
    await videoEl.play();

    await new Promise<void>((resolve) => {
      const finish = () => resolve();
      videoEl.onended = finish;
      
      setTimeout(finish, Math.ceil(duration * 1000) + 1500);
    });

    if (recorder.state !== "inactive") recorder.stop();
    videoEl.pause();
    stream.getTracks().forEach((t) => t.stop());

    const blob = await stopped;
    if (!blob.size || blob.size >= file.size * 0.98) {
      
      return file;
    }

    return new File([blob], `${baseName(file)}.webm`, {
      type: "video/webm",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    videoEl.removeAttribute("src");
    videoEl.load();
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
