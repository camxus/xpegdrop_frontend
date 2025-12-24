export interface EXIFData {
  /* =====================
   * IFD0 / Basic Image
   * ===================== */
  Make?: string;
  Model?: string;
  Software?: string;
  HostComputer?: string;

  Orientation?: string; // e.g. "Rotate 90 CW"
  XResolution?: number;
  YResolution?: number;
  ResolutionUnit?: "inches" | "cm" | number;

  ExifImageWidth?: number;
  ExifImageHeight?: number;

  CreateDate?: Date;
  ModifyDate?: Date;

  /* =====================
   * EXIF / Camera
   * ===================== */
  ExposureTime?: number; // seconds (0.02)
  ShutterSpeedValue?: number;
  FNumber?: number;
  ApertureValue?: number;
  BrightnessValue?: number;
  ExposureCompensation?: number;

  ISO?: number;
  ISOSpeedRatings?: number;

  ExposureMode?: string;
  ExposureProgram?: string;
  MeteringMode?: string;

  Flash?: string;
  WhiteBalance?: string;

  FocalLength?: number;
  FocalLengthIn35mmFormat?: number;

  LensMake?: string;
  LensModel?: string;
  LensInfo?: number[];

  SceneType?: string;
  SceneCaptureType?: string;
  SensingMethod?: string;

  SubjectArea?: Uint16Array;

  DateTimeOriginal?: Date;
  DateTimeDigitized?: Date;

  /* =====================
   * GPS (RAW EXIF)
   * ===================== */
  GPSLatitude?: number[];       // [deg, min, sec]
  GPSLatitudeRef?: "N" | "S";

  GPSLongitude?: number[];      // [deg, min, sec]
  GPSLongitudeRef?: "E" | "W";

  GPSAltitude?: number;
  GPSAltitudeRef?: number;

  GPSTimeStamp?: string | number[];
  GPSDateStamp?: string;

  GPSImgDirection?: number;
  GPSImgDirectionRef?: string;

  GPSDestBearing?: number;
  GPSDestBearingRef?: string;

  GPSSpeed?: number;
  GPSSpeedRef?: string;

  GPSHPositioningError?: number;

  /* =====================
   * Normalized / Derived
   * ===================== */
  latitude?: number;  // decimal degrees
  longitude?: number; // decimal degrees

  /* =====================
   * Misc
   * ===================== */
  ColorSpace?: number;
  ComponentsConfiguration?: Uint8Array;
  CompositeImage?: string;

  MakerNote?: Record<string, any>;
  IPTC?: Record<string, any>;
  XMP?: Record<string, any>;
}

export interface ImageFile {
  id: string
  name: string
  url: string
  file: File
  folder: string
  metadata?: EXIFData | null
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