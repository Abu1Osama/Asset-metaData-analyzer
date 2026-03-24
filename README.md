# Asset Metadata Analyzer

A comprehensive tool for analyzing fonts and images, extracting detailed metadata in real-time using browser-based APIs.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Font Analysis (TTF, OTF, WOFF, WOFF2)

**Basic Information:**

- Font family, subfamily, full name
- Version, PostScript name, unique ID
- File size and format

**Typography Details:**

- Weight (100-900) with class names (Thin, Regular, Bold, etc.)
- Width classification
- Style detection (italic, bold)
- **Variable font detection** (detects fonts with multiple weights)
- **Number of weights** (1 for single-weight, multiple for variable fonts)
- **Weight range** (e.g., "400" or "100-900" for variable fonts)
- Units per Em, ascent, descent, line gap
- x-height and cap height

**Character Support:**

- Total glyph count
- Character set preview (first 100 characters)
- Supported languages (Latin, Cyrillic, Greek, Arabic, CJK, Thai, Devanagari, etc.)
- OpenType tables present

**Legal & Credits:**

- Designer and manufacturer information
- Copyright and trademark
- License information and URL
- Font description
- Creation and modification timestamps

### Logo/Image Analysis (PNG, JPG, SVG, WebP)

**Basic Information:**

- File name, size, type, MIME type
- Dimensions (width × height)
- Aspect ratio
- Orientation (landscape/portrait/square)
- Megapixels
- Transparency detection (alpha channel)

**Advanced Color Analysis:**

- **Dominant Colors**: Top 5 colors with percentages
- **Color Palette**: Complete palette (up to 10 colors)
- **Color Statistics**:
  - Average color
  - Brightness (0-100%)
  - Saturation (0-100%)
  - Colorfulness metric (0-100%)
  - Unique color count
- RGB and HSL values for all colors

**Image Quality Metrics:**

- High-resolution detection (2MP+)
- **Recommended Use Cases**:
  - Print (Large Format) - 8MP+
  - Print (Standard) - 4MP+
  - Web (Full HD) - 2MP+
  - Social Media - 0.5MP+
  - Icons/Thumbnails - <0.5MP
  - HD Display compatibility
  - Social media profile suitability

**Format-Specific Data:**

**SVG Files:**

- ViewBox dimensions
- Element count
- Contains text (yes/no)
- Has gradients (yes/no)
- Has filters (yes/no)

**PNG Files:**

- Color type (Grayscale, RGB, RGBA, Indexed, etc.)
- Bit depth (8-bit, 16-bit, etc.)
- Interlaced (yes/no)

## Technical Implementation

### Browser-Based Parsing

- **Minimal dependencies** - primarily uses browser APIs
- **Font parsing**: DataView for binary OpenType/TrueType table parsing
- **WOFF/WOFF2 support**: FontFace API for compressed font formats
- **ZIP extraction**: JSZip library for archive handling
- **Image parsing**: Canvas API for color extraction, DOMParser for SVG
- **Format detection**: Binary signature analysis (WOFF, WOFF2, PNG)
- **URL fetching**: Fetch API for remote font loading

### Architecture

```
/app/
├── page.tsx                              # Root page
└── asset-metadata-analyzer/
    ├── page.tsx                          # Main analyzer page with tabs
    ├── types.ts                          # TypeScript interfaces
    ├── utils/
    │   └── file-parser.ts                # Parsing logic
    └── components/
        ├── FontDetailsPanel.tsx          # Font metadata display
        └── EnhancedImageDetailsPanel.tsx # Comprehensive image display
```

### Parsed Font Tables

- `name` - Font names and metadata
- `OS/2` - Weight, width, style flags
- `head` - Units per Em
- `hhea` - Ascent, descent, line gap
- `cmap` - Character mapping
- `fvar` - Font variations (variable fonts) - weight axis detection

### Image Analysis Algorithms

- **Color quantization**: 32-level RGB quantization for palette extraction
- **Dominant color detection**: Frequency-based sorting
- **Colorfulness metric**: RG-YB opponent color space calculation
- **Brightness/Saturation**: HSL conversion and averaging

## Usage

### Upload Methods

**Font Files:**

1. **Single File Upload**: Upload individual font files (TTF, OTF, WOFF, WOFF2)
2. **ZIP Archive**: Upload a ZIP file containing multiple fonts - automatically extracts and lists all fonts with a selector dropdown
3. **URL Loading**: Enter a direct URL to a font file hosted online

**Logo Images:**

1. **Single File Upload**: Upload individual image files (PNG, JPG, SVG, WebP)

### Steps

1. Run the development server and open the app
2. Select either "Font Files" or "Logo Images" tab
3. Choose upload method:
   - Click upload area to browse files
   - Drag & drop files
   - Enter URL (fonts only)
4. For ZIP files: Select which font to analyze from the dropdown
5. View comprehensive metadata instantly

## Supported Formats

**Fonts:**

- TrueType (.ttf)
- OpenType (.otf)
- Web Open Font Format (.woff)
- Web Open Font Format 2 (.woff2)

**Images:**

- PNG (.png)
- JPEG (.jpg, .jpeg)
- SVG (.svg)
- WebP (.webp)

## Notes

- All processing happens in the browser - no server uploads
- Files are not stored or transmitted
- Maximum file size: 10MB (per file or ZIP archive)
- **Variable fonts**: Automatically detected via `fvar` table, shows weight range (e.g., 100-900)
- **Single-weight fonts**: Each file contains one weight (standard for web fonts)
- **ZIP archives**: Extracts all font files, skips \_\_MACOSX and hidden files
- **WOFF/WOFF2**: Uses browser's FontFace API for metadata extraction (compressed formats)
- Color analysis uses downsampled images for performance
- URL loading requires CORS-enabled font URLs
