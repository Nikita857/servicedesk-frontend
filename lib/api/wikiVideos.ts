import api from "./client";
import type { ApiResponse } from "@/types/api";

export interface WikiVideoResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  fileKey: string;
}

export const wikiVideoApi = {
  /**
   * Upload a video for wiki articles
   */
  uploadVideo: async (file: File): Promise<WikiVideoResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<WikiVideoResponse>>(
      "/wiki/videos",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 0, // no timeout for video upload — large files can take minutes
      },
    );
    return response.data.data;
  },

  /**
   * Delete a video by file key
   */
  deleteVideo: async (fileKey: string): Promise<void> => {
    await api.delete(`/wiki/videos/${fileKey}`);
  },
};
