import { FontMetadata } from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FontDetailsPanelProps {
  metadata: FontMetadata;
}

export function FontDetailsPanel({ metadata }: FontDetailsPanelProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Font Information</CardTitle>
          <CardDescription>
            Basic metadata extracted from the font file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem label="File Name" value={metadata.fileName} />
            <InfoItem
              label="File Size"
              value={formatFileSize(metadata.fileSize)}
            />
            <InfoItem label="File Type" value={metadata.fileType} />
            <InfoItem label="Font Family" value={metadata.fontFamily} />
            <InfoItem label="Font Subfamily" value={metadata.fontSubfamily} />
            <InfoItem label="Full Name" value={metadata.fullName} />
            <InfoItem label="PostScript Name" value={metadata.postScriptName} />
            <InfoItem label="Version" value={metadata.version} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography Details</CardTitle>
          <CardDescription>
            Weight, style, and dimensional properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Weight"
              value={`${metadata.weight} (${metadata.weightClass})`}
            />
            <InfoItem
              label="Width"
              value={`${metadata.width} (${metadata.widthClass})`}
            />
            <InfoItem
              label="Style"
              value={
                <div className="flex gap-2">
                  {metadata.isBold && <Badge variant="secondary">Bold</Badge>}
                  {metadata.isItalic && (
                    <Badge variant="secondary">Italic</Badge>
                  )}
                  {!metadata.isBold && !metadata.isItalic && (
                    <Badge variant="outline">Regular</Badge>
                  )}
                </div>
              }
            />
            <InfoItem
              label="Variable Font"
              value={
                <div className="flex gap-2">
                  {metadata.isVariableFont ? (
                    <Badge variant="default">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>
              }
            />
            <InfoItem
              label="Number of Weights"
              value={metadata.numWeights.toString()}
            />
            <InfoItem label="Weight Range" value={metadata.weightRange} />
            <InfoItem
              label="Units Per Em"
              value={metadata.unitsPerEm.toString()}
            />
            <InfoItem label="Ascent" value={metadata.ascent.toString()} />
            <InfoItem label="Descent" value={metadata.descent.toString()} />
            <InfoItem label="Line Gap" value={metadata.lineGap.toString()} />
            <InfoItem label="x-Height" value={metadata.xHeight.toString()} />
            <InfoItem
              label="Cap Height"
              value={metadata.capHeight.toString()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character Support</CardTitle>
          <CardDescription>
            Glyphs, languages, and character coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoItem
            label="Total Glyphs"
            value={metadata.numGlyphs.toString()}
          />

          <div>
            <h4 className="mb-2 text-sm font-medium">Supported Languages</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.supportedLanguages.map((lang) => (
                <Badge key={lang} variant="secondary">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-medium">
              Character Set Preview (First 100 characters)
            </h4>
            <div className="bg-muted break-all rounded-lg p-4 font-mono text-sm">
              {metadata.characterSet.join("")}
            </div>
          </div>
        </CardContent>
      </Card>

      {metadata.openTypeFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>OpenType Features</CardTitle>
            <CardDescription>
              Advanced typographic features available in this font
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metadata.openTypeFeatures.map((feature) => (
                <Badge key={feature} variant="outline">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Font Tables</CardTitle>
          <CardDescription>
            OpenType/TrueType tables present in the font
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {metadata.tables.map((table) => (
              <Badge key={table} variant="outline" className="font-mono">
                {table}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {(metadata.designer || metadata.manufacturer || metadata.copyright) && (
        <Card>
          <CardHeader>
            <CardTitle>Legal & Credits</CardTitle>
            <CardDescription>
              Designer, manufacturer, and licensing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metadata.designer && (
              <InfoItem label="Designer" value={metadata.designer} />
            )}
            {metadata.manufacturer && (
              <InfoItem label="Manufacturer" value={metadata.manufacturer} />
            )}
            {metadata.copyright && (
              <InfoItem label="Copyright" value={metadata.copyright} />
            )}
            {metadata.trademark && (
              <InfoItem label="Trademark" value={metadata.trademark} />
            )}
            {metadata.license && (
              <InfoItem label="License" value={metadata.license} />
            )}
            {metadata.licenseURL && (
              <InfoItem
                label="License URL"
                value={
                  <a
                    href={metadata.licenseURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {metadata.licenseURL}
                  </a>
                }
              />
            )}
            {metadata.description && (
              <InfoItem label="Description" value={metadata.description} />
            )}
            {metadata.uniqueId && (
              <InfoItem label="Unique ID" value={metadata.uniqueId} />
            )}
          </CardContent>
        </Card>
      )}

      {(metadata.createdDate || metadata.modifiedDate) && (
        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
            <CardDescription>
              Font creation and modification dates
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {metadata.createdDate && (
              <InfoItem
                label="Created"
                value={formatDate(metadata.createdDate)}
              />
            )}
            {metadata.modifiedDate && (
              <InfoItem
                label="Modified"
                value={formatDate(metadata.modifiedDate)}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground mb-1 text-sm font-medium">
        {label}
      </dt>
      <dd className="text-sm">{value || "N/A"}</dd>
    </div>
  );
}
