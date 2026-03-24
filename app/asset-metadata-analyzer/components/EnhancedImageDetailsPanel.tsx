import { ImageMetadata } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EnhancedImageDetailsPanelProps {
  metadata: ImageMetadata;
}

export function EnhancedImageDetailsPanel({ metadata }: EnhancedImageDetailsPanelProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Image Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Image Preview</CardTitle>
          <CardDescription>Visual representation of the uploaded image</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8 bg-muted/50 rounded-lg">
            <div className="relative max-w-md w-full">
              <img
                src={metadata.previewUrl}
                alt={metadata.fileName}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic File Information */}
      <Card>
        <CardHeader>
          <CardTitle>File Information</CardTitle>
          <CardDescription>Basic metadata and file properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="File Name" value={metadata.fileName} />
            <InfoItem label="File Size" value={formatFileSize(metadata.fileSize)} />
            <InfoItem label="File Type" value={metadata.fileType} />
            <InfoItem label="MIME Type" value={metadata.mimeType} />
          </div>
        </CardContent>
      </Card>

      {/* Dimensions & Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensions & Properties</CardTitle>
          <CardDescription>Image size, orientation, and resolution details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoItem label="Width" value={`${metadata.width}px`} />
            <InfoItem label="Height" value={`${metadata.height}px`} />
            <InfoItem label="Aspect Ratio" value={metadata.aspectRatio} />
            <InfoItem 
              label="Orientation" 
              value={
                <Badge variant="secondary" className="capitalize">
                  {metadata.orientation}
                </Badge>
              } 
            />
            <InfoItem label="Megapixels" value={`${metadata.megapixels} MP`} />
            <InfoItem 
              label="Transparency" 
              value={
                <Badge variant={metadata.hasAlpha ? "default" : "secondary"}>
                  {metadata.hasAlpha ? "Has Alpha Channel" : "No Alpha Channel"}
                </Badge>
              } 
            />
          </div>
        </CardContent>
      </Card>

      {/* Color Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Color Analysis</CardTitle>
          <CardDescription>Comprehensive color statistics and metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Average Color</h4>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: metadata.colorStats.averageColor.hex }}
                />
                <span className="font-mono text-sm">{metadata.colorStats.averageColor.hex.toUpperCase()}</span>
              </div>
            </div>
            <InfoItem label="Brightness" value={`${metadata.colorStats.brightness}%`} />
            <InfoItem label="Saturation" value={`${metadata.colorStats.saturation}%`} />
            <InfoItem label="Colorfulness" value={`${metadata.colorStats.colorfulness}%`} />
          </div>
          
          <Separator />
          
          <InfoItem label="Unique Colors" value={metadata.colorStats.uniqueColors.toLocaleString()} />
        </CardContent>
      </Card>

      {/* Dominant Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Dominant Colors</CardTitle>
          <CardDescription>Top 5 most prominent colors in the image</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metadata.dominantColors.map((color, index) => (
              <div key={index} className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{color.hex.toUpperCase()}</span>
                    {color.percentage && (
                      <Badge variant="outline">{color.percentage.toFixed(1)}%</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b}) • 
                    HSL({color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Complete color palette extracted from the image</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {metadata.colorPalette.map((color, index) => (
              <div key={index} className="group relative">
                <div 
                  className="w-full aspect-square rounded-md border-2 border-border shadow-sm cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.hex.toUpperCase()}\nRGB(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {color.hex.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Quality & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Image Quality & Recommendations</CardTitle>
          <CardDescription>Quality assessment and recommended use cases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Resolution Quality:</span>
            <Badge variant={metadata.quality.isHighRes ? "default" : "secondary"}>
              {metadata.quality.isHighRes ? "High Resolution" : "Standard Resolution"}
            </Badge>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Recommended Use Cases</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.quality.recommendedUse.map((use, index) => (
                <Badge key={index} variant="outline">{use}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SVG-Specific Data */}
      {metadata.svgData && (
        <Card>
          <CardHeader>
            <CardTitle>SVG Details</CardTitle>
            <CardDescription>Vector graphics specific information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="ViewBox" value={metadata.svgData.viewBox} />
              <InfoItem label="Element Count" value={metadata.svgData.elementCount.toString()} />
              <InfoItem 
                label="Contains Text" 
                value={
                  <Badge variant={metadata.svgData.hasText ? "default" : "secondary"}>
                    {metadata.svgData.hasText ? "Yes" : "No"}
                  </Badge>
                } 
              />
              <InfoItem 
                label="Has Gradients" 
                value={
                  <Badge variant={metadata.svgData.hasGradients ? "default" : "secondary"}>
                    {metadata.svgData.hasGradients ? "Yes" : "No"}
                  </Badge>
                } 
              />
              <InfoItem 
                label="Has Filters" 
                value={
                  <Badge variant={metadata.svgData.hasFilters ? "default" : "secondary"}>
                    {metadata.svgData.hasFilters ? "Yes" : "No"}
                  </Badge>
                } 
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* PNG-Specific Data */}
      {metadata.pngData && (
        <Card>
          <CardHeader>
            <CardTitle>PNG Details</CardTitle>
            <CardDescription>PNG format specific information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoItem label="Color Type" value={metadata.pngData.colorType} />
              <InfoItem label="Bit Depth" value={`${metadata.pngData.bitDepth}-bit`} />
              <InfoItem 
                label="Interlaced" 
                value={
                  <Badge variant={metadata.pngData.interlaced ? "default" : "secondary"}>
                    {metadata.pngData.interlaced ? "Yes" : "No"}
                  </Badge>
                } 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground mb-1">{label}</dt>
      <dd className="text-sm">{value || 'N/A'}</dd>
    </div>
  );
}
