import api from "./client";
import type { ApiResponse } from "@/types/api";

export interface WikiImageResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  fileKey: string;
}

export const wikiImageApi = {
  /**
   * Upload an image for wiki articles
   */
  uploadImage: async (file: File): Promise<WikiImageResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<WikiImageResponse>>(
      "/wiki/images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  /**
   * Delete an image by file key
   */
  deleteImage: async (fileKey: string): Promise<void> => {
    await api.delete(`/wiki/images/${fileKey}`);
  },
};
