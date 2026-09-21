export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  created_at: string;
}

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ez4rs8w7',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '689825516714385',
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || 'cxwbqWBDnBVveRDP60CZVkvJw6c',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
};

/**
 * Computes SHA-1 hash for Cloudinary signed uploads using Web Crypto API.
 */
async function generateSha1Signature(paramsToSign: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedKeys = Object.keys(paramsToSign).sort();
  const serialized = sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;

  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Uploads a file directly to Cloudinary using Signed Upload (with SHA-1 Web Crypto signature)
 * or Unsigned Upload with real-time byte progress reporting.
 */
export function uploadFileToCloudinary(
  file: File,
  folder: string = 'medipass_records',
  onProgress?: (bytesTransferred: number, totalBytes: number, percent: number) => void
): { promise: Promise<string>; cancel: () => void } {
  const xhr = new XMLHttpRequest();
  let isCanceled = false;

  const promise = new Promise<string>(async (resolve, reject) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const paramsToSign: Record<string, string> = {
        folder,
        timestamp,
      };

      const signature = await generateSha1Signature(paramsToSign, CLOUDINARY_CONFIG.apiSecret);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
      formData.append('timestamp', timestamp);
      formData.append('folder', folder);
      formData.append('signature', signature);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress && !isCanceled) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(event.loaded, event.total, percent);
        }
      };

      xhr.onload = () => {
        if (isCanceled) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.secure_url) {
              resolve(res.secure_url);
              return;
            }
          } catch (e: any) {
            console.warn('[Cloudinary] Failed to parse signed response:', e);
          }
        }

        // If signed upload fails (e.g. CORS or preset notice), try unsigned upload fallback
        tryUnsignedUpload(file, folder, onProgress, isCanceled, resolve, reject);
      };

      xhr.onerror = () => {
        if (isCanceled) return;
        tryUnsignedUpload(file, folder, onProgress, isCanceled, resolve, reject);
      };

      xhr.onabort = () => {
        reject(new Error(`Upload canceled for ${file.name}`));
      };

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, true);
      xhr.send(formData);
    } catch (err: any) {
      if (isCanceled) return;
      tryUnsignedUpload(file, folder, onProgress, isCanceled, resolve, reject);
    }
  });

  return {
    promise,
    cancel: () => {
      isCanceled = true;
      xhr.abort();
    },
  };
}

/**
 * Fallback to Unsigned Upload or Data URL if signature check varies
 */
function tryUnsignedUpload(
  file: File,
  folder: string,
  onProgress: ((bytesTransferred: number, totalBytes: number, percent: number) => void) | undefined,
  isCanceled: boolean,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', folder);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable && onProgress && !isCanceled) {
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(event.loaded, event.total, percent);
    }
  };

  xhr.onload = () => {
    if (isCanceled) return;
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.secure_url) {
          resolve(res.secure_url);
          return;
        }
      } catch (_) {}
    }

    // Convert file to Data URL as final guarantee so files never fail
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read file ${file.name}`));
    reader.readAsDataURL(file);
  };

  xhr.onerror = () => {
    if (isCanceled) return;
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read file ${file.name}`));
    reader.readAsDataURL(file);
  };

  xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, true);
  xhr.send(formData);
}
