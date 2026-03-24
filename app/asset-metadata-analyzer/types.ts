export interface FontMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  fontFamily: string;
  fontSubfamily: string;
  fullName: string;
  version: string;
  postScriptName: string;
  uniqueId: string;
  designer: string;
  manufacturer: string;
  copyright: string;
  license: string;
  licenseURL: string;
  trademark: string;
  description: string;
  weight: number;
  weightClass: string;
  width: number;
  widthClass: string;
  isItalic: boolean;
  isBold: boolean;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  xHeight: number;
  capHeight: number;
  numGlyphs: number;
  characterSet: string[];
  supportedLanguages: string[];
  openTypeFeatures: string[];
  tables: string[];
  createdDate?: Date;
  modifiedDate?: Date;
  isVariableFont: boolean;
  numWeights: number;
  weightRange: string;
}

export interface ImageMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: "landscape" | "portrait" | "square";
  megapixels: number;
  hasAlpha: boolean;
  dominantColors: ColorInfo[];
  colorPalette: ColorInfo[];
  previewUrl: string;

  // Color analysis
  colorStats: {
    averageColor: ColorInfo;
    brightness: number; // 0-100
    saturation: number; // 0-100
    colorfulness: number; // 0-100
    uniqueColors: number;
  };

  // Image quality metrics
  quality: {
    isHighRes: boolean;
    dpi?: number;
    recommendedUse: string[];
  };

  // SVG-specific data
  svgData?: {
    viewBox: string;
    hasText: boolean;
    hasGradients: boolean;
    hasFilters: boolean;
    elementCount: number;
  };

  // PNG-specific data
  pngData?: {
    colorType: string;
    bitDepth: number;
    interlaced: boolean;
  };
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage?: number;
}
