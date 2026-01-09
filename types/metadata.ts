import { EXIFData } from ".";

export interface Metadata {
  project_id: string;
  media_name: string;
  exif_data: EXIFData;
  media_hash?: string;
  created_at: string;
  updated_at: string;
}
