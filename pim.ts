export type FormatCategory = 
  | 'subtitles'
  | 'geo'
  | 'ebooks'
  | 'pim'
  | 'audio'
  | 'data'
  | 'scientific'
  | '3d'
  | 'syndication'
  | 'vector';

export interface FormatPreset {
  targetFormat: string;
  label: string; // e.g. "SRT в VTT"
  description: string; // e.g. "Стандарт для онлайн-плееров HTML5 и веб-видео"
  badge?: string; // e.g. "Популярно", "Веб", "Excel"
}

export interface FormatDetail {
  developer: string;
  standardOrType: string;
  mimeTypeDetailed: string;
  keyFeatures: string[];
  syntaxTips: string;
  relatedFormats: string[];
}

export interface FormatSpec {
  id: string; // e.g. 'srt'
  extension: string; // e.g. '.srt'
  name: string;
  category: FormatCategory;
  description: string;
  usedFor: string;
  targets: string[]; // ids of possible target formats
  mimeType: string;
  sampleContent?: string;
  iconName?: string;
  presets?: FormatPreset[];
  details?: FormatDetail;
}

export interface ConvertedFile {
  id: string;
  originalName: string;
  originalExtension: string;
  size: number;
  sourceFormat: string;
  targetFormat: string;
  status: 'idle' | 'converting' | 'success' | 'error';
  sourceContent: string | ArrayBuffer;
  resultContent?: string | Blob;
  resultName?: string;
  errorMessage?: string;
  conversionTimeMs?: number;
  isZipExtracted?: boolean;
}

export interface CategoryInfo {
  id: FormatCategory;
  name: string;
  description: string;
  icon: string;
}
