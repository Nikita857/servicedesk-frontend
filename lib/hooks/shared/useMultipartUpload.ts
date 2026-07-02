import { useState } from "react";
import axios from "axios";
import { attachmentApi } from "@/lib/api/attachments";
import { useFileUpload } from "./useFileUpload";
import type { AttachmentResponse, MultipartPartInfo } from "@/types/attachment";
import { toast, withRetry } from "@/lib/utils";

type TargetType = "TICKET" | "MESSAGE" | "DIRECT_MESSAGE" | "WIKI_ARTICLE";

// Порог, выше которого один PUT в S3/MinIO невозможен → идём в multipart
const MULTIPART_THRESHOLD = 5 * 1024 * 1024 * 1024; // 5 ГБ
// Размер одной части
const CHUNK_SIZE = 100 * 1024 * 1024; // 100 МБ

export interface MultipartProgress {
  uploadedParts: number;
  totalParts: number;
}

interface UseMultipartUploadReturn {
  upload: (
    file: File,
    targetType: TargetType,
    targetId: number,
  ) => Promise<AttachmentResponse | null>;
  isUploading: boolean;
  progress: Record<string, MultipartProgress>;
}

/**
 * Загрузка файлов с поддержкой больших размеров (до 10 ГБ).
 * Файлы ≤ 5 ГБ идут прежним single-PUT путём (useFileUpload),
 * файлы > 5 ГБ — через MinIO Multipart Upload с разбиением на части.
 */
export const useMultipartUpload = (): UseMultipartUploadReturn => {
  const { upload: uploadSingle } = useFileUpload();
  const [activeUploads, setActiveUploads] = useState(0);
  const [progress, setProgress] = useState<Record<string, MultipartProgress>>(
    {},
  );

  const uploadMultipart = async (
    uploadKey: string,
    file: File,
    targetType: TargetType,
    targetId: number,
  ): Promise<AttachmentResponse | null> => {
    // 1. Инициация
    const { uploadId, fileKey, bucket } = await attachmentApi.initiateMultipart(
      {
        filename: file.name,
        contentType: file.type,
        targetType,
        targetId,
      },
    );

    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    setProgress((prev) => ({
      ...prev,
      [uploadKey]: { uploadedParts: 0, totalParts },
    }));

    const parts: MultipartPartInfo[] = [];

    // 2. Последовательная загрузка частей напрямую в MinIO
    try {
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const { partUrl } = await attachmentApi.getPartUrl({
          fileKey,
          bucket,
          uploadId,
          partNumber,
        });

        const res = await withRetry(() =>
          axios.put(partUrl, chunk, {
            headers: { "Content-Type": file.type },
          }),
        );

        const etag = res.headers["etag"] ?? res.headers["ETag"];
        if (!etag) {
          throw new Error(
            `MinIO не вернул ETag для части ${partNumber}. ` +
              'Проверьте CORS бакета: ExposeHeaders должен включать "ETag".',
          );
        }

        // ETag приходит в кавычках ("abc123") — убираем для complete
        parts.push({ partNumber, etag: etag.replace(/"/g, "") });
        setProgress((prev) => ({
          ...prev,
          [uploadKey]: { uploadedParts: partNumber, totalParts },
        }));
      }
      // 3. Завершение — бэкенд склеит части и создаст запись о вложении
      return await attachmentApi.completeMultipart({
        fileKey,
        bucket,
        uploadId,
        parts,
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        targetType,
        targetId,
      });
    } catch (err) {
      try {
        await attachmentApi.abortMultipart({ fileKey, bucket, uploadId });
      } catch (abortErr) {
        console.error("Не удалось отменить multipart upload:", abortErr);
      }
      throw err;
    }
  };

  const upload = async (
    file: File,
    targetType: TargetType,
    targetId: number,
  ): Promise<AttachmentResponse | null> => {
    // Небольшие файлы — прежним проверенным путём
    if (file.size <= MULTIPART_THRESHOLD) {
      return uploadSingle(file, targetType, targetId);
    }

    const uploadKey = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
    setActiveUploads((c) => c + 1);
    try {
      return await uploadMultipart(uploadKey, file, targetType, targetId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Multipart upload failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Не удалось загрузить файл";
      toast.error("Ошибка загрузки", msg);
      return null;
    } finally {
      setActiveUploads((c) => c - 1);
      setProgress((prev) => {
        const { [uploadKey]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  return { upload, isUploading: activeUploads > 0, progress };
};
