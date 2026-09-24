import axios from "axios";
import type { WikiMediaResponse } from "@/types/attachment";
import { getServiceDeskAPI } from './generated/client';
import { withRetry } from "../utils";

const generated = getServiceDeskAPI();

// Порог: выше — S3/MinIO не примет один PUT → идём в multipart
const MULTIPART_THRESHOLD = 5 * 1024 * 1024 * 1024; // 5 ГБ
// Размер одной части
const CHUNK_SIZE = 100 * 1024 * 1024; // 100 МБ

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
  const initResp = await generated.initiateMultipart({
    filename: file.name,
    contentType: file.type,
  });
  const { uploadId, fileKey, bucket } = initResp.data!;
  if (!uploadId || !fileKey || !bucket) throw new Error('Multipart upload initialization is incomplete');

  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const parts: { partNumber: number; etag: string }[] = [];
  let uploadedBytes = 0;

  // Step 2: последовательная загрузка частей напрямую в MinIO
  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const partResp = await generated.getPartUrl({
        fileKey,
        bucket,
        uploadId,
        partNumber,
      });
      const partUrl = partResp.data?.['partUrl'];
      if (!partUrl) throw new Error('Multipart part URL response is incomplete');

      const res = await withRetry(() =>
        axios.put(partUrl, chunk, {
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
    const completeResp = await generated.completeMultipart({
      fileKey,
      bucket,
      uploadId,
      parts,
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    });
    return completeResp.data as WikiMediaResponse;
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
  await generated.abortMultipart({ fileKey, bucket, uploadId });
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
    const urlResp = await generated.getUploadUrl({
      filename: file.name,
      contentType: file.type,
    });
    const { uploadUrl, fileKey, filename } = urlResp.data!;
    if (!uploadUrl || !fileKey || !filename) throw new Error('Video upload URL response is incomplete');

    // Step 2: upload directly to MinIO (auth is signed into the URL)
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: onProgress
        ? (e) =>
            onProgress(Math.round((e.loaded * 100) / (e.total ?? e.loaded)))
        : undefined,
    });

    // Step 3: confirm on backend
    const confirmResp = await generated.confirmUpload({
      fileKey,
      filename,
      contentType: file.type,
      fileSize: file.size,
    });
    return confirmResp.data as WikiMediaResponse;
  },

  /**
   * Delete a video by file key
   */
  deleteVideo: async (fileKey: string): Promise<void> => {
    await generated.deleteVideo(fileKey);
  },
};
