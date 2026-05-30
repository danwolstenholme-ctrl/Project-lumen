export type FileKey = "thumbnail" | "video";

export async function validateThumbnail(file: File): Promise<void> {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Thumbnail must be a JPG or PNG file.");
  }
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 1920 || img.height < 1080) {
        reject(
          new Error(
            `Thumbnail must be at least 1920×1080px. Detected: ${img.width}×${img.height}px.`
          )
        );
      } else {
        resolve();
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Cannot read image file.")); };
    img.src = url;
  });
}

export async function validateShowVideo(file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith(".mp4")) {
    throw new Error("Your piece must be an .mp4 file (H.264 or H.265).");
  }
  if (file.size > 4 * 1024 * 1024 * 1024) {
    throw new Error("Your piece must be 4GB or less.");
  }
  // Browser-side resolution pre-check — Mux runs the authoritative validation
  // server-side once the file lands, including framerate, codec, and duration.
  await new Promise<void>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w !== 3840 || h !== 2160) {
        reject(
          new Error(
            `Your video must be 4K (3840×2160px). Current resolution detected: ${w}×${h}px.`
          )
        );
      } else {
        resolve();
      }
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Cannot read video file. Ensure it is a valid .mp4.")); };
    video.src = url;
  });
}

export async function validate(key: FileKey, file: File): Promise<void> {
  if (key === "thumbnail") return validateThumbnail(file);
  if (key === "video") return validateShowVideo(file);
}

export function uploadToSupabase(
  supabaseUrl: string,
  storagePath: string,
  token: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("cacheControl", "3600");
    formData.append("", file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/upload/sign/${storagePath}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body.message ?? `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}

export function uploadToMux(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload to Mux failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload to Mux."));
    xhr.send(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
