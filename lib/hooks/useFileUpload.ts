import { useState } from 'react';
import axios from 'axios';
import { attachmentApi, Attachment } from '@/lib/api/attachments';
import { toaster } from '@/components/ui/toaster';

interface UseFileUploadReturn {
  upload: (
    file: File, 
    targetType: 'TICKET' | 'MESSAGE' | 'DIRECT_MESSAGE' | 'WIKI_ARTICLE', 
    targetId: number
  ) => Promise<Attachment | null>;
  isUploading: boolean;
  error: string | null;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    file: File,
    targetType: 'TICKET' | 'MESSAGE' | 'DIRECT_MESSAGE' | 'WIKI_ARTICLE',
    targetId: number
  ): Promise<Attachment | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // 1. Get Presigned URL
      const { uploadUrl, fileKey, bucket } = await attachmentApi.getUploadUrl(
        file.name,
        file.type,
        targetType,
        targetId
      );

      // 2. Upload to MinIO
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      // 3. Confirm upload
      const attachment = await attachmentApi.confirmUpload({
        fileKey,
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        bucket,
        targetType,
        targetId,
      });

      return attachment;
    } catch (err: any) {
      console.error('File upload failed:', err);
      const errorMessage = err.response?.data?.message || 'Не удалось загрузить файл';
      setError(errorMessage);
      toaster.error({
        title: 'Ошибка загрузки',
        description: errorMessage,
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
};
