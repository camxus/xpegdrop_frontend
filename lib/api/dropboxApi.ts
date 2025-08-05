import type { DropboxUploadResponse } from "@/types"

export const dropboxApi = {
  uploadFile: async (file: File, path: string): Promise<DropboxUploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("path", path)

    const response = await fetch("/api/dropbox/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file to Dropbox")
    }

    return response.json()
  },

  uploadFolder: async (files: File[], folderName: string): Promise<DropboxUploadResponse[]> => {
    const uploadPromises = files.map((file) => dropboxApi.uploadFile(file, `/${folderName}/${file.name}`))

    return Promise.all(uploadPromises)
  },
}
