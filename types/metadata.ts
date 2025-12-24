import { EXIFData } from ".";

export interface Metadata {
  project_id: string;
  image_name: string;
  exif_data: EXIFData;
  image_hash?: string;
  created_at: string;
  updated_at: string;
}
