import api from "./client";
import axios from "axios";
import type { ApiResponse } from "@/types/api";
import type { WikiMediaResponse, WikiMediaUploadUrlResponse } from "@/types/attachment";

export const wikiVideoApi = {
  /**
   * Upload a video for wiki articles via presigned URL (client → MinIO directly).
   * Step 1: get presigned PUT URL from backend.
   * Step 2: PUT file directly to MinIO (no Spring proxy — suitable for large files).
   * Step 3: confirm upload on backend.
   */
  uploadVideo: async (
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<WikiMediaResponse> => {
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
    const { data: confirmResp } = await api.post<ApiResponse<WikiMediaResponse>>(
      "/wiki/videos/confirm",
      {
        fileKey,
        filename,
        contentType: file.type,
        fileSize: file.size,
      },
    );
    return confirmResp.data;
  },

  /**
   * Delete a video by file key
   */
  deleteVideo: async (fileKey: string): Promise<void> => {
    await api.delete(`/wiki/videos/${fileKey}`);
  },
};
