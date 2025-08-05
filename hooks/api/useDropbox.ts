"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dropboxApi } from "@/lib/api/dropboxApi"
import { useToast } from "@/hooks/use-toast"

export function useDropbox() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const uploadFileMutation = useMutation({
    mutationFn: ({ file, path }: { file: File; path: string }) => dropboxApi.uploadFile(file, path),
    onSuccess: () => {
      toast({ title: "Success", description: "File uploaded to Dropbox successfully" })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file to Dropbox",
        variant: "destructive",
      })
    },
  })

  const uploadFolderMutation = useMutation({
    mutationFn: ({ files, folderName }: { files: File[]; folderName: string }) =>
      dropboxApi.uploadFolder(files, folderName),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dropbox-uploads"] })
      toast({ title: "Success", description: "Folder uploaded to Dropbox successfully" })

      // Store the upload success state
      queryClient.setQueryData(["dropbox-upload-success", variables.folderName], {
        success: true,
        uploadedAt: new Date(),
        shareUrl: `https://dropbox.com/sh/${variables.folderName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload folder to Dropbox",
        variant: "destructive",
      })
    },
  })

  // Add function to get upload success state
  const getUploadSuccess = (folderName: string) => {
    return queryClient.getQueryData(["dropbox-upload-success", folderName])
  }

  return {
    uploadFile: uploadFileMutation,
    uploadFolder: uploadFolderMutation,
    getUploadSuccess,
  }
}
