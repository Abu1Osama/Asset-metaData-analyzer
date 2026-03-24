import { FontMetadata, ImageMetadata, ColorInfo } from "../types";

export async function parseFontFile(file: File): Promise<FontMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // Detect font format
  const signature = dataView.getUint32(0);
  const isWOFF = signature === 0x774f4646; // 'wOFF'
  const isWOFF2 = signature === 0x774f4632; // 'wOF2'

  // For WOFF2, we need to use the browser's font loading to get metadata
  // since WOFF2 uses Brotli compression which requires native decompression
  const fontUrl = URL.createObjectURL(file);
  let fontFace: FontFace | null = null;
  let fontFaceMetadata: Partial<FontMetadata> | null = null;

  try {
    fontFace = new FontFace("TestFont", `url(${fontUrl})`);
    await fontFace.load();

    // Try to extract metadata from loaded font
    if (isWOFF2 || isWOFF) {
      fontFaceMetadata = extractMetadataFromFontFace(fontFace, file.name);
    }
  } catch (error) {
    console.warn("FontFace API failed:", error);
  }

  // For WOFF2 and WOFF, use metadata from FontFace API
  // WOFF2 uses Brotli compression, WOFF uses zlib - both require native decompression
  if ((isWOFF2 || isWOFF) && fontFaceMetadata) {
    URL.revokeObjectURL(fontUrl);
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: isWOFF2 ? "WOFF2" : "WOFF",
      ...fontFaceMetadata,
    } as FontMetadata;
  }

  const nameTable = parseNameTable(dataView);
  const os2Table = parseOS2Table(dataView);
  const headTable = parseHeadTable(dataView);
  const hheaTable = parseHheaTable(dataView);
  const cmapTable = parseCmapTable(dataView);
  const fvarTable = parseFvarTable(dataView);

  const weight = os2Table?.usWeightClass || 400;
  const weightClass = getWeightClassName(weight);
  const width = os2Table?.usWidthClass || 5;
  const widthClass = getWidthClassName(width);

  const characterSet = cmapTable.characterSet;
  const supportedLanguages = detectSupportedLanguages(characterSet);
  const tables = getTableNames(dataView);

  // Determine number of weights
  let numWeights = 1; // Default: single weight file
  let isVariableFont = false;
  let weightRange = `${weight}`;

  if (fvarTable) {
    isVariableFont = true;
    numWeights = fvarTable.weightCount;
    weightRange = `${fvarTable.minWeight}-${fvarTable.maxWeight}`;
  }

  URL.revokeObjectURL(fontUrl);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
    fontFamily: nameTable.fontFamily || "Unknown",
    fontSubfamily: nameTable.fontSubfamily || "Regular",
    fullName: nameTable.fullName || "Unknown",
    version: nameTable.version || "Unknown",
    postScriptName: nameTable.postScriptName || "Unknown",
    uniqueId: nameTable.uniqueId || "Unknown",
    designer: nameTable.designer || "",
    manufacturer: nameTable.manufacturer || "",
    copyright: nameTable.copyright || "",
    license: nameTable.license || "",
    licenseURL: nameTable.licenseURL || "",
    trademark: nameTable.trademark || "",
    description: nameTable.description || "",
    weight,
    weightClass,
    width,
    widthClass,
    isItalic: os2Table?.isItalic || false,
    isBold: os2Table?.isBold || false,
    unitsPerEm: headTable?.unitsPerEm || 1000,
    ascent: hheaTable?.ascender || 0,
    descent: hheaTable?.descender || 0,
    lineGap: hheaTable?.lineGap || 0,
    xHeight: os2Table?.sxHeight || 0,
    capHeight: os2Table?.sCapHeight || 0,
    numGlyphs: cmapTable.numGlyphs,
    characterSet: characterSet.slice(0, 100),
    supportedLanguages,
    openTypeFeatures: [],
    tables,
    createdDate: headTable?.created,
    modifiedDate: headTable?.modified,
    isVariableFont,
    numWeights,
    weightRange,
  };
}

export async function parseImageFile(file: File): Promise<ImageMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });
  const previewUrl = URL.createObjectURL(blob);

  const img = await loadImage(previewUrl);
  const colorData = await extractColors(img);
  const hasAlpha = await hasAlphaChannel(img);
  const colorStats = calculateColorStats(colorData.allPixels);
  const orientation = getOrientation(img.width, img.height);
  const megapixels = (img.width * img.height) / 1000000;
  const quality = analyzeImageQuality(img.width, img.height);

  // Format-specific parsing
  let svgData;
  let pngData;

  if (file.type === "image/svg+xml") {
    svgData = await parseSVG(arrayBuffer);
  } else if (file.type === "image/png") {
    pngData = parsePNG(arrayBuffer);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
    mimeType: file.type,
    width: img.width,
    height: img.height,
    aspectRatio: calculateAspectRatio(img.width, img.height),
    orientation,
    megapixels: parseFloat(megapixels.toFixed(2)),
    hasAlpha,
    dominantColors: colorData.dominantColors,
    colorPalette: colorData.palette,
    colorStats,
    quality,
    svgData,
    pngData,
    previewUrl,
  };
}

function extractMetadataFromFontFace(
  fontFace: FontFace,
  fileName: string,
): Partial<FontMetadata> {
  // Extract what we can from the loaded FontFace
  const family = fontFace.family || "Unknown";
  const style = fontFace.style || "normal";
  const weight = fontFace.weight || "400";

  // Parse weight
  const weightNum = parseInt(weight, 10) || 400;
  const weightClass = getWeightClassName(weightNum);

  // Determine if italic
  const isItalic =
    style.toLowerCase().includes("italic") ||
    style.toLowerCase().includes("oblique");

  // Determine if bold
  const isBold = weightNum >= 700;

  // Parse subfamily from style and weight
  let subfamily = "Regular";
  if (isItalic && isBold) {
    subfamily = "Bold Italic";
  } else if (isBold) {
    subfamily = "Bold";
  } else if (isItalic) {
    subfamily = "Italic";
  } else if (weightNum !== 400) {
    subfamily = weightClass;
  }

  // Try to extract base name from filename
  // Remove file extension
  let baseName = fileName.replace(/\.(woff2?|ttf|otf)$/i, "");

  // Remove hash/version suffixes (e.g., ".f1f0c35b", "-v1.2", etc.)
  baseName = baseName.replace(/[.-][a-f0-9]{8,}$/i, "");
  baseName = baseName.replace(/[-_]v?\d+(\.\d+)*$/i, "");

  // Extract font family and subfamily from filename
  // Common patterns: "FontName-Weight", "FontName_Weight", "FontName Weight"
  const parts = baseName.split(/[-_]/);
  const possibleFamily = parts[0] || baseName;
  let possibleSubfamily =
    parts.length > 1 ? parts.slice(1).join(" ") : subfamily;

  // Clean up variable font indicators
  possibleSubfamily = possibleSubfamily.replace(/\.var$/i, "");
  possibleSubfamily = possibleSubfamily.replace(/\bvar\b/i, "Variable");
  possibleSubfamily = possibleSubfamily.replace(/\broman\b/i, "");
  possibleSubfamily = possibleSubfamily.trim() || "Variable";

  // Use parsed family if FontFace didn't provide one
  const finalFamily = family !== "TestFont" ? family : possibleFamily;
  const finalSubfamily = family !== "TestFont" ? subfamily : possibleSubfamily;

  return {
    fontFamily: finalFamily,
    fontSubfamily: finalSubfamily,
    fullName: `${finalFamily} ${finalSubfamily}`,
    version: "Unknown",
    postScriptName: `${finalFamily}${finalSubfamily}`.replace(/\s/g, ""),
    uniqueId: `${finalFamily}-${finalSubfamily}`,
    designer: "",
    manufacturer: "",
    copyright: "",
    license: "",
    licenseURL: "",
    trademark: "",
    description: "",
    weight: weightNum,
    weightClass,
    width: 5,
    widthClass: "Normal",
    isItalic,
    isBold,
    unitsPerEm: 1000,
    ascent: 0,
    descent: 0,
    lineGap: 0,
    xHeight: 0,
    capHeight: 0,
    numGlyphs: 0,
    characterSet: [],
    supportedLanguages: ["Latin"],
    openTypeFeatures: [],
    tables: [],
    isVariableFont: false,
    numWeights: 1,
    weightRange: `${weightNum}`,
  };
}

function getWeightClassName(weight: number): string {
  if (weight <= 100) return "Thin";
  if (weight <= 200) return "Extra Light";
  if (weight <= 300) return "Light";
  if (weight <= 400) return "Regular";
  if (weight <= 500) return "Medium";
  if (weight <= 600) return "Semi Bold";
  if (weight <= 700) return "Bold";
  if (weight <= 800) return "Extra Bold";
  return "Black";
}

function getWidthClassName(width: number): string {
  const widthNames = [
    "Ultra Condensed",
    "Extra Condensed",
    "Condensed",
    "Semi Condensed",
    "Normal",
    "Semi Expanded",
    "Expanded",
    "Extra Expanded",
    "Ultra Expanded",
  ];
  return widthNames[width - 1] || "Normal";
}

function getTableNames(dataView: DataView): string[] {
  try {
    const numTables = dataView.getUint16(4);
    const tables: string[] = [];

    for (let i = 0; i < numTables; i++) {
      const offset = 12 + i * 16;
      const tag = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3),
      );
      tables.push(tag);
    }

    return tables;
  } catch {
    return [];
  }
}

function findTable(dataView: DataView, tag: string): number | null {
  try {
    const numTables = dataView.getUint16(4);

    for (let i = 0; i < numTables; i++) {
      const offset = 12 + i * 16;
      const tableTag = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3),
      );

      if (tableTag === tag) {
        return dataView.getUint32(offset + 8);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function parseNameTable(dataView: DataView): {
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
} {
  const result = {
    fontFamily: "",
    fontSubfamily: "",
    fullName: "",
    version: "",
    postScriptName: "",
    uniqueId: "",
    designer: "",
    manufacturer: "",
    copyright: "",
    license: "",
    licenseURL: "",
    trademark: "",
    description: "",
  };

  try {
    const tableOffset = findTable(dataView, "name");
    if (!tableOffset) return result;

    const count = dataView.getUint16(tableOffset + 2);
    const stringOffset = dataView.getUint16(tableOffset + 4);

    const nameIds: Record<number, keyof typeof result> = {
      0: "copyright",
      1: "fontFamily",
      2: "fontSubfamily",
      3: "uniqueId",
      4: "fullName",
      5: "version",
      6: "postScriptName",
      7: "trademark",
      8: "manufacturer",
      9: "designer",
      10: "description",
      13: "license",
      14: "licenseURL",
    };

    for (let i = 0; i < count; i++) {
      const recordOffset = tableOffset + 6 + i * 12;
      const platformID = dataView.getUint16(recordOffset);
      const nameID = dataView.getUint16(recordOffset + 6);
      const length = dataView.getUint16(recordOffset + 8);
      const offset = dataView.getUint16(recordOffset + 10);

      if (nameIds[nameID] && (platformID === 1 || platformID === 3)) {
        const textOffset = tableOffset + stringOffset + offset;
        let text = "";

        if (platformID === 1) {
          for (let j = 0; j < length; j++) {
            text += String.fromCharCode(dataView.getUint8(textOffset + j));
          }
        } else {
          for (let j = 0; j < length; j += 2) {
            text += String.fromCharCode(dataView.getUint16(textOffset + j));
          }
        }

        if (text && !result[nameIds[nameID]]) {
          result[nameIds[nameID]] = text;
        }
      }
    }
  } catch {
    // Return partial results
  }

  return result;
}

function parseOS2Table(dataView: DataView): {
  usWeightClass: number;
  usWidthClass: number;
  isItalic: boolean;
  isBold: boolean;
  sxHeight: number;
  sCapHeight: number;
} | null {
  try {
    const tableOffset = findTable(dataView, "OS/2");
    if (!tableOffset) return null;

    const usWeightClass = dataView.getUint16(tableOffset + 4);
    const usWidthClass = dataView.getUint16(tableOffset + 6);
    const fsSelection = dataView.getUint16(tableOffset + 62);
    const sxHeight = dataView.getInt16(tableOffset + 86);
    const sCapHeight = dataView.getInt16(tableOffset + 88);

    return {
      usWeightClass,
      usWidthClass,
      isItalic: (fsSelection & 1) !== 0,
      isBold: (fsSelection & 32) !== 0,
      sxHeight,
      sCapHeight,
    };
  } catch {
    return null;
  }
}

function parseHeadTable(dataView: DataView): {
  unitsPerEm: number;
  created?: Date;
  modified?: Date;
} | null {
  try {
    const tableOffset = findTable(dataView, "head");
    if (!tableOffset) return null;

    const unitsPerEm = dataView.getUint16(tableOffset + 18);

    return {
      unitsPerEm,
    };
  } catch {
    return null;
  }
}

function parseHheaTable(dataView: DataView): {
  ascender: number;
  descender: number;
  lineGap: number;
} | null {
  try {
    const tableOffset = findTable(dataView, "hhea");
    if (!tableOffset) return null;

    const ascender = dataView.getInt16(tableOffset + 4);
    const descender = dataView.getInt16(tableOffset + 6);
    const lineGap = dataView.getInt16(tableOffset + 8);

    return {
      ascender,
      descender,
      lineGap,
    };
  } catch {
    return null;
  }
}

function parseFvarTable(dataView: DataView): {
  weightCount: number;
  minWeight: number;
  maxWeight: number;
} | null {
  try {
    const tableOffset = findTable(dataView, "fvar");
    if (!tableOffset) return null;

    // fvar table structure:
    // Offset 0: majorVersion (2 bytes)
    // Offset 2: minorVersion (2 bytes)
    // Offset 4: axisArrayOffset (2 bytes)
    // Offset 6: reserved (2 bytes)
    // Offset 8: axisCount (2 bytes)
    // Offset 10: axisSize (2 bytes)

    const axisCount = dataView.getUint16(tableOffset + 8);
    const axisArrayOffset = dataView.getUint16(tableOffset + 4);

    // Look for weight axis (tag 'wght')
    for (let i = 0; i < axisCount; i++) {
      const axisOffset = tableOffset + axisArrayOffset + i * 20;

      // Read axis tag (4 bytes)
      const tag = String.fromCharCode(
        dataView.getUint8(axisOffset),
        dataView.getUint8(axisOffset + 1),
        dataView.getUint8(axisOffset + 2),
        dataView.getUint8(axisOffset + 3),
      );

      if (tag === "wght") {
        // Found weight axis
        // Offset 4: minValue (Fixed 16.16)
        // Offset 8: defaultValue (Fixed 16.16)
        // Offset 12: maxValue (Fixed 16.16)

        const minWeight = Math.round(dataView.getInt32(axisOffset + 4) / 65536);
        const maxWeight = Math.round(
          dataView.getInt32(axisOffset + 12) / 65536,
        );

        // Estimate number of weights (rough approximation)
        // Typically fonts have weights at 100 intervals
        const weightCount = Math.floor((maxWeight - minWeight) / 100) + 1;

        return {
          weightCount,
          minWeight,
          maxWeight,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function parseCmapTable(dataView: DataView): {
  characterSet: string[];
  numGlyphs: number;
} {
  const chars: string[] = [];
  let numGlyphs = 0;

  try {
    const tableOffset = findTable(dataView, "cmap");
    if (!tableOffset) return { characterSet: chars, numGlyphs };

    const numSubtables = dataView.getUint16(tableOffset + 2);

    for (let i = 0; i < numSubtables; i++) {
      const subtableOffset = tableOffset + 4 + i * 8;
      const platformID = dataView.getUint16(subtableOffset);
      const offset = dataView.getUint32(subtableOffset + 4);

      if (platformID === 3 || platformID === 0) {
        const format = dataView.getUint16(tableOffset + offset);

        if (format === 4) {
          const segCount = dataView.getUint16(tableOffset + offset + 6) / 2;
          const endCodes: number[] = [];
          const startCodes: number[] = [];

          for (let j = 0; j < Math.min(segCount, 50); j++) {
            endCodes.push(
              dataView.getUint16(tableOffset + offset + 14 + j * 2),
            );
          }

          for (let j = 0; j < Math.min(segCount, 50); j++) {
            startCodes.push(
              dataView.getUint16(
                tableOffset + offset + 16 + segCount * 2 + j * 2,
              ),
            );
          }

          for (let j = 0; j < Math.min(segCount, 50); j++) {
            for (
              let code = startCodes[j];
              code <= endCodes[j] && chars.length < 500;
              code++
            ) {
              if (code !== 0xffff) {
                chars.push(String.fromCharCode(code));
                numGlyphs++;
              }
            }
          }

          break;
        }
      }
    }
  } catch {
    // Return partial results
  }

  return { characterSet: chars, numGlyphs };
}

function detectSupportedLanguages(characterSet: string[]): string[] {
  const languages: string[] = ["Latin"];
  const charSet = new Set(characterSet);

  if (hasCharactersInRange(charSet, 0x0400, 0x04ff)) languages.push("Cyrillic");
  if (hasCharactersInRange(charSet, 0x0370, 0x03ff)) languages.push("Greek");
  if (hasCharactersInRange(charSet, 0x0590, 0x05ff)) languages.push("Hebrew");
  if (hasCharactersInRange(charSet, 0x0600, 0x06ff)) languages.push("Arabic");
  if (hasCharactersInRange(charSet, 0x4e00, 0x9fff))
    languages.push("CJK (Chinese/Japanese/Korean)");
  if (hasCharactersInRange(charSet, 0x0e00, 0x0e7f)) languages.push("Thai");
  if (hasCharactersInRange(charSet, 0x0900, 0x097f))
    languages.push("Devanagari");

  return languages;
}

function hasCharactersInRange(
  charSet: Set<string>,
  start: number,
  end: number,
): boolean {
  for (let i = start; i <= Math.min(end, start + 50); i++) {
    if (charSet.has(String.fromCharCode(i))) return true;
  }
  return false;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function extractColors(img: HTMLImageElement): Promise<{
  dominantColors: ColorInfo[];
  palette: ColorInfo[];
  allPixels: { r: number; g: number; b: number }[];
}> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const maxSize = 100;
  const scale = Math.min(maxSize / img.width, maxSize / img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const colorMap = new Map<string, number>();
  const allPixels: { r: number; g: number; b: number }[] = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 128) continue;

    allPixels.push({ r, g, b });

    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;
    const key = `${quantizedR},${quantizedG},${quantizedB}`;

    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const totalPixels = canvas.width * canvas.height;

  const dominantColors = sortedColors.slice(0, 5).map(([color, count]) => {
    const [r, g, b] = color.split(",").map(Number);
    return createColorInfo(r, g, b, (count / totalPixels) * 100);
  });

  const palette = sortedColors.map(([color]) => {
    const [r, g, b] = color.split(",").map(Number);
    return createColorInfo(r, g, b);
  });

  return { dominantColors, palette, allPixels };
}

function createColorInfo(
  r: number,
  g: number,
  b: number,
  percentage?: number,
): ColorInfo {
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  const hsl = rgbToHsl(r, g, b);

  return {
    hex,
    rgb: { r, g, b },
    hsl,
    percentage,
  };
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

async function hasAlphaChannel(img: HTMLImageElement): Promise<boolean> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 255) return true;
  }

  return false;
}

function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function getOrientation(
  width: number,
  height: number,
): "landscape" | "portrait" | "square" {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.05) return "square";
  return ratio > 1 ? "landscape" : "portrait";
}

function calculateColorStats(pixels: { r: number; g: number; b: number }[]): {
  averageColor: ColorInfo;
  brightness: number;
  saturation: number;
  colorfulness: number;
  uniqueColors: number;
} {
  if (pixels.length === 0) {
    return {
      averageColor: createColorInfo(128, 128, 128),
      brightness: 50,
      saturation: 0,
      colorfulness: 0,
      uniqueColors: 0,
    };
  }

  let totalR = 0,
    totalG = 0,
    totalB = 0;
  let totalBrightness = 0,
    totalSaturation = 0;
  const uniqueColorSet = new Set<string>();

  pixels.forEach(({ r, g, b }) => {
    totalR += r;
    totalG += g;
    totalB += b;

    const hsl = rgbToHsl(r, g, b);
    totalBrightness += hsl.l;
    totalSaturation += hsl.s;
    uniqueColorSet.add(`${r},${g},${b}`);
  });

  const avgR = Math.round(totalR / pixels.length);
  const avgG = Math.round(totalG / pixels.length);
  const avgB = Math.round(totalB / pixels.length);

  const brightness = Math.round(totalBrightness / pixels.length);
  const saturation = Math.round(totalSaturation / pixels.length);

  const rg =
    pixels.reduce((sum, p) => sum + Math.abs(p.r - p.g), 0) / pixels.length;
  const yb =
    pixels.reduce((sum, p) => sum + Math.abs(0.5 * (p.r + p.g) - p.b), 0) /
    pixels.length;
  const colorfulness = Math.round(Math.sqrt(rg * rg + yb * yb) / 2.55);

  return {
    averageColor: createColorInfo(avgR, avgG, avgB),
    brightness,
    saturation,
    colorfulness: Math.min(100, colorfulness),
    uniqueColors: uniqueColorSet.size,
  };
}

function analyzeImageQuality(
  width: number,
  height: number,
): {
  isHighRes: boolean;
  dpi?: number;
  recommendedUse: string[];
} {
  const megapixels = (width * height) / 1000000;
  const isHighRes = megapixels >= 2;
  const recommendedUse: string[] = [];

  if (megapixels >= 8) {
    recommendedUse.push("Print (Large Format)");
    recommendedUse.push("Professional Photography");
  } else if (megapixels >= 4) {
    recommendedUse.push("Print (Standard)");
    recommendedUse.push("High-Quality Web");
  } else if (megapixels >= 2) {
    recommendedUse.push("Web (Full HD)");
    recommendedUse.push("Social Media");
  } else if (megapixels >= 0.5) {
    recommendedUse.push("Web (Standard)");
    recommendedUse.push("Thumbnails");
  } else {
    recommendedUse.push("Icons");
    recommendedUse.push("Small Thumbnails");
  }

  if (width >= 1920 && height >= 1080) {
    recommendedUse.push("HD Display");
  }

  if (width === height) {
    recommendedUse.push("Social Media Profile");
  }

  return {
    isHighRes,
    recommendedUse,
  };
}

async function parseSVG(arrayBuffer: ArrayBuffer): Promise<{
  viewBox: string;
  hasText: boolean;
  hasGradients: boolean;
  hasFilters: boolean;
  elementCount: number;
}> {
  try {
    const text = new TextDecoder().decode(arrayBuffer);
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");

    if (!svg) {
      return {
        viewBox: "N/A",
        hasText: false,
        hasGradients: false,
        hasFilters: false,
        elementCount: 0,
      };
    }

    const viewBox =
      svg.getAttribute("viewBox") ||
      `0 0 ${svg.getAttribute("width")} ${svg.getAttribute("height")}`;
    const hasText = doc.querySelectorAll("text, tspan").length > 0;
    const hasGradients =
      doc.querySelectorAll("linearGradient, radialGradient").length > 0;
    const hasFilters = doc.querySelectorAll("filter").length > 0;
    const elementCount = doc.querySelectorAll("*").length;

    return {
      viewBox,
      hasText,
      hasGradients,
      hasFilters,
      elementCount,
    };
  } catch {
    return {
      viewBox: "N/A",
      hasText: false,
      hasGradients: false,
      hasFilters: false,
      elementCount: 0,
    };
  }
}

function parsePNG(arrayBuffer: ArrayBuffer): {
  colorType: string;
  bitDepth: number;
  interlaced: boolean;
} {
  try {
    const view = new DataView(arrayBuffer);

    if (view.getUint32(0) !== 0x89504e47) {
      throw new Error("Not a PNG file");
    }

    let offset = 8;
    let colorType = "Unknown";
    let bitDepth = 8;
    let interlaced = false;

    while (offset < arrayBuffer.byteLength) {
      const length = view.getUint32(offset);
      const type = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7),
      );

      if (type === "IHDR") {
        bitDepth = view.getUint8(offset + 16);
        const colorTypeNum = view.getUint8(offset + 17);
        interlaced = view.getUint8(offset + 20) === 1;

        const colorTypes: Record<number, string> = {
          0: "Grayscale",
          2: "RGB",
          3: "Indexed",
          4: "Grayscale + Alpha",
          6: "RGBA",
        };
        colorType = colorTypes[colorTypeNum] || "Unknown";
        break;
      }

      offset += length + 12;
    }

    return { colorType, bitDepth, interlaced };
  } catch {
    return {
      colorType: "Unknown",
      bitDepth: 8,
      interlaced: false,
    };
  }
}
