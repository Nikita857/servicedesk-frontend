import api from "./client";
import axios from "axios";
import type { ApiResponse } from "@/types/api";
import type {
  WikiMediaResponse,
  WikiMediaUploadUrlResponse,
} from "@/types/attachment";
import { withRetry } from "../utils";

// Порог: выше — S3/MinIO не примет один PUT → идём в multipart
const MULTIPART_THRESHOLD = 5 * 1024 * 1024 * 1024; // 5 ГБ
// Размер одной части
const CHUNK_SIZE = 100 * 1024 * 1024; // 100 МБ

interface InitiateMultipartResponse {
  uploadId: string;
  fileKey: string;
  bucket: string;
}

/**
 * Multipart-загрузка большого видео (> 5 ГБ) частями напрямую в MinIO.
 * Прогресс считается по суммарно отправленным байтам всех частей —
 * тот же 0–100%, что и у одиночного PUT, поэтому UI-бар работает без изменений.
 */
async function uploadVideoMultipart(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<WikiMediaResponse> {
  // Step 1: инициация multipart на бэкенде
  const { data: initResp } = await api.post<
    ApiResponse<InitiateMultipartResponse>
  >("/wiki/videos/multipart/initiate", {
    filename: file.name,
    contentType: file.type,
  });
  const { uploadId, fileKey, bucket } = initResp.data;

  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const parts: { partNumber: number; etag: string }[] = [];
  let uploadedBytes = 0;

  // Step 2: последовательная загрузка частей напрямую в MinIO
  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const { data: partResp } = await api.post<
        ApiResponse<{ partUrl: string }>
      >("/wiki/videos/multipart/part-url", {
        fileKey,
        bucket,
        uploadId,
        partNumber,
      });

      const res = await withRetry(() =>
        axios.put(partResp.data.partUrl, chunk, {
          headers: { "Content-Type": file.type },
          onUploadProgress: onProgress
            ? (e) => {
                const overall = Math.round(
                  ((uploadedBytes + e.loaded) * 100) / file.size,
                );
                onProgress(Math.min(overall, 100));
              }
            : undefined,
        }),
      );

      const etag = res.headers["etag"] ?? res.headers["ETag"];
      if (!etag) {
        throw new Error(
          `MinIO не вернул ETag для части ${partNumber}. ` +
            'Проверьте CORS бакета: ExposeHeaders должен включать "ETag".',
        );
      }

      // ETag приходит в кавычках ("abc") — убираем для complete
      parts.push({ partNumber, etag: etag.replace(/"/g, "") });
      uploadedBytes += chunk.size;
      onProgress?.(
        Math.min(Math.round((uploadedBytes * 100) / file.size), 100),
      );
    }
    // Step 3: завершение — бэкенд склеит части и вернёт URL для стриминга
    const { data: completeResp } = await api.post<
      ApiResponse<WikiMediaResponse>
    >("/wiki/videos/multipart/complete", {
      fileKey,
      bucket,
      uploadId,
      parts,
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    });
    return completeResp.data;
  } catch (err) {
    try {
      await abortVideoMultipart(fileKey, bucket, uploadId);
    } catch (abortErr) {
      console.error(abortErr);
    }
    throw err;
  }
}

async function abortVideoMultipart(
  fileKey: string,
  bucket: string,
  uploadId: string,
): Promise<void> {
  await api.post("/wiki/videos/multipart/abort", { fileKey, bucket, uploadId });
}

export const wikiVideoApi = {
  /**
   * Upload a video for wiki articles.
   * ≤ 5 ГБ — одиночный presigned PUT; > 5 ГБ — multipart с разбиением на части.
   * Оба пути дают прогресс 0–100% через onProgress.
   */
  uploadVideo: async (
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<WikiMediaResponse> => {
    // Большие видео — через multipart (один PUT в S3/MinIO ограничен 5 ГБ)
    if (file.size > MULTIPART_THRESHOLD) {
      return uploadVideoMultipart(file, onProgress);
    }

    // Step 1: request presigned URL
    const { data: urlResp } = await api.post<
      ApiResponse<WikiMediaUploadUrlResponse>
    >("/wiki/videos/upload-url", {
      filename: file.name,
      contentType: file.type,
    });
    const { uploadUrl, fileKey, filename } = urlResp.data;

    // Step 2: upload directly to MinIO (auth is signed into the URL)
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: onProgress
        ? (e) =>
            onProgress(Math.round((e.loaded * 100) / (e.total ?? e.loaded)))
        : undefined,
    });

    // Step 3: confirm on backend
    const { data: confirmResp } = await api.post<
      ApiResponse<WikiMediaResponse>
    >("/wiki/videos/confirm", {
      fileKey,
      filename,
      contentType: file.type,
      fileSize: file.size,
    });
    return confirmResp.data;
  },

  /**
   * Delete a video by file key
   */
  deleteVideo: async (fileKey: string): Promise<void> => {
    await api.delete(`/wiki/videos/${fileKey}`);
  },
};
