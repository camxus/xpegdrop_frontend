export interface ImageFile {
  id: string
  name: string
  url: string
  file: File
  folder: string
}

export interface Folder {
  id: string
  name: string
  images: ImageFile[]
  createdAt: Date
}

export interface DropboxUploadResponse {
  id: string
  name: string
  path_lower: string
  url: string
}

export interface CreateFolderDto {
  name: string
  images: File[]
}

export interface UpdateFolderDto {
  name: string
}

export type StorageProvider = "b2" | "dropbox"