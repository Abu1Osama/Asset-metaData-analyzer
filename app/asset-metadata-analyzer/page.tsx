"use client";

import { useState } from "react";
import { Upload, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseFontFile, parseImageFile } from "./utils/file-parser";
import type { FontMetadata, ImageMetadata } from "./types";
import { FontDetailsPanel } from "./components/FontDetailsPanel";
import { EnhancedImageDetailsPanel } from "./components/EnhancedImageDetailsPanel";

export default function FontAnalyzerPage() {
  const [fontMetadata, setFontMetadata] = useState<FontMetadata | null>(null);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"font" | "image">("font");
  const [fontUrl, setFontUrl] = useState("");
  const [zipFonts, setZipFonts] = useState<FontMetadata[]>([]);
  const [selectedZipFont, setSelectedZipFont] = useState<number>(0);

  const handleFontUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setFontMetadata(null);

    try {
      const metadata = await parseFontFile(file);
      setFontMetadata(metadata);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse font file",
      );
    } finally {
      setIsProcessing(false);
      // Reset input to allow re-uploading the same file
      event.target.value = "";
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setImageMetadata(null);

    try {
      const metadata = await parseImageFile(file);
      setImageMetadata(metadata);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse image file",
      );
    } finally {
      setIsProcessing(false);
      // Reset input to allow re-uploading the same file
      event.target.value = "";
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontUrl.trim()) return;

    setIsProcessing(true);
    setError(null);
    setFontMetadata(null);
    setZipFonts([]);

    try {
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error("Failed to fetch font from URL");

      const blob = await response.blob();
      const fileName = fontUrl.split("/").pop() || "font-from-url";
      const file = new File([blob], fileName, { type: blob.type });

      const metadata = await parseFontFile(file);
      setFontMetadata(metadata);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load font from URL",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZipUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setFontMetadata(null);
    setZipFonts([]);

    try {
      // Dynamic import of JSZip
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      const fontFiles: FontMetadata[] = [];
      const fontExtensions = /\.(ttf|otf|woff|woff2)$/i;

      for (const fileName in contents.files) {
        const zipEntry = contents.files[fileName];

        // Skip directories, hidden files, and __MACOSX folder
        if (
          zipEntry &&
          !zipEntry.dir &&
          !fileName.startsWith("__MACOSX") &&
          !fileName.startsWith(".") &&
          fontExtensions.test(fileName)
        ) {
          const blob = await zipEntry.async("blob");
          const fontFile = new File(
            [blob],
            fileName.split("/").pop() || fileName,
            {
              type: "application/font",
            },
          );

          try {
            const metadata = await parseFontFile(fontFile);
            fontFiles.push(metadata);
          } catch (err) {
            console.warn(`Failed to parse ${fileName}:`, err);
            // Skip files that fail to parse
          }
        }
      }

      if (fontFiles.length === 0) {
        throw new Error("No valid font files found in ZIP archive");
      }

      setZipFonts(fontFiles);
      setSelectedZipFont(0);
      setFontMetadata(fontFiles[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse ZIP file");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Asset Metadata Analyzer</h1>
        <p className="text-muted-foreground">
          Extract detailed metadata from fonts (TTF, OTF, WOFF, WOFF2) and
          images (PNG, JPG, SVG, WebP)
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "font" | "image")}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="font">Font Files</TabsTrigger>
          <TabsTrigger value="image">Logo Images</TabsTrigger>
        </TabsList>

        <TabsContent value="font" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Font File</CardTitle>
                <CardDescription>
                  Single font file (TTF, OTF, WOFF, WOFF2)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label
                  htmlFor="font-upload"
                  className="bg-muted/50 hover:bg-muted/70 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                >
                  <Upload className="text-muted-foreground mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-xs">
                    Click to upload font file
                  </p>
                  <input
                    id="font-upload"
                    type="file"
                    className="hidden"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFontUpload}
                    disabled={isProcessing}
                  />
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload ZIP Archive</CardTitle>
                <CardDescription>Multiple fonts in a ZIP file</CardDescription>
              </CardHeader>
              <CardContent>
                <label
                  htmlFor="zip-upload"
                  className="bg-muted/50 hover:bg-muted/70 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                >
                  <Upload className="text-muted-foreground mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-xs">
                    Click to upload ZIP file
                  </p>
                  <input
                    id="zip-upload"
                    type="file"
                    className="hidden"
                    accept=".zip"
                    onChange={handleZipUpload}
                    disabled={isProcessing}
                  />
                </label>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Load from URL</CardTitle>
              <CardDescription>
                Enter a direct URL to a font file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <input
                  type="url"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  placeholder="https://example.com/font.woff2"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !fontUrl.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  Load
                </button>
              </form>
            </CardContent>
          </Card>

          {isProcessing && (
            <div className="text-muted-foreground text-center text-sm">
              Processing font file...
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          {zipFonts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Font from ZIP</CardTitle>
                <CardDescription>
                  Found {zipFonts.length} font{zipFonts.length !== 1 ? "s" : ""}{" "}
                  in the archive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedZipFont}
                  onChange={(e) => {
                    const index = parseInt(e.target.value);
                    setSelectedZipFont(index);
                    setFontMetadata(zipFonts[index]);
                  }}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {zipFonts.map((font, index) => (
                    <option key={index} value={index}>
                      {font.fontFamily} {font.fontSubfamily} - {font.fileName}
                      {font.isVariableFont
                        ? " (Variable)"
                        : ` (${font.weightRange})`}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          {fontMetadata && <FontDetailsPanel metadata={fontMetadata} />}
        </TabsContent>

        <TabsContent value="image" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Logo Image</CardTitle>
              <CardDescription>
                Supports PNG, JPG, JPEG, SVG, and WebP formats. Extracts
                dimensions, colors, and metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex w-full items-center justify-center">
                <label
                  htmlFor="image-upload"
                  className="bg-muted/50 hover:bg-muted/70 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <Upload className="text-muted-foreground mb-4 h-12 w-12" />
                    <p className="text-muted-foreground mb-2 text-sm">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-muted-foreground text-xs">
                      PNG, JPG, SVG, WebP (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={handleImageUpload}
                    disabled={isProcessing}
                  />
                </label>
              </div>

              {isProcessing && (
                <div className="text-muted-foreground mt-4 text-center text-sm">
                  Processing image file...
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 text-destructive mt-4 rounded-lg p-4 text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {imageMetadata && (
            <EnhancedImageDetailsPanel metadata={imageMetadata} />
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/30 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            About This Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            This tool analyzes font and logo files in real-time using
            browser-based parsing. No files are uploaded to a server.
          </p>
          <p>
            <strong>Font Analysis:</strong> Extracts font family, style, weight,
            version, character sets, OpenType features, and more.
          </p>
          <p>
            <strong>Logo Analysis:</strong> Extracts dimensions, file size,
            color palette, format details, and EXIF metadata.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
