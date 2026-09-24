import axios from "axios";
import type { WikiMediaResponse } from "@/types/attachment";
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const wikiImageApi = {
  /**
   * Upload an image for wiki articles via presigned URL (client → MinIO directly).
   * Step 1: get presigned PUT URL from backend.
   * Step 2: PUT file directly to MinIO.
   * Step 3: confirm upload on backend.
   */
  uploadImage: async (
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<WikiMediaResponse> => {
    // Step 1: request presigned URL
    const urlResp = await generated.getUploadUrl1({
      filename: file.name,
      contentType: file.type,
    });
    const { uploadUrl, fileKey, filename } = urlResp.data!;
    if (!uploadUrl || !fileKey || !filename) throw new Error('Image upload URL response is incomplete');

    // Step 2: upload directly to MinIO (auth is signed into the URL)
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: onProgress
        ? (e) =>
            onProgress(Math.round((e.loaded * 100) / (e.total ?? e.loaded)))
        : undefined,
    });

    // Step 3: confirm on backend
    const confirmResp = await generated.confirmUpload1({
        fileKey,
        filename,
        contentType: file.type,
        fileSize: file.size,
      });
    return confirmResp.data as WikiMediaResponse;
  },

  /**
   * Delete an image by file key
   */
  deleteImage: async (fileKey: string): Promise<void> => {
    await generated.deleteImage(fileKey);
  },
};
