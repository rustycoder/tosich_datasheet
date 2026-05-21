# DataSheet — Excel to PDF Generator

A sleek web application that reads Excel files (with embedded images), lets you design PDF templates using HTML/CSS with a live code editor, and generates downloadable PDFs.

![Built with](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

- **Excel Upload** — Drag & drop or browse to upload `.xlsx` files with instant data preview
- **Embedded Image Support** — Automatically extracts images embedded in Excel cells (e.g., Picture, Dimension columns)
- **Template Editor** — Full CodeMirror code editor with syntax highlighting for HTML & CSS
- **Placeholder System** — Use `{{column_name}}` placeholders that auto-fill with Excel data
- **Live Preview** — Real-time preview of your template with actual data and images
- **Built-in Templates** — 4 professional templates: Default, Certificate, Invoice, Data Sheet
- **PDF Export** — Generate multi-page PDFs with customizable page size, orientation & margins
- **Template Storage** — Save and load custom templates via localStorage

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone or navigate to the project directory:**

   ```bash
   cd /path/to/datasheet
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open in browser:**

   The app will automatically open at [http://localhost:3000](http://localhost:3000).
   If it doesn't, open the URL shown in the terminal.

### Production Build

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## 📖 How to Use

### Step 1: Upload Excel File

- Drag & drop an `.xlsx` file onto the upload area, or click to browse
- The app automatically extracts:
  - **Cell data** (text, numbers, dates)
  - **Embedded images** (converted to base64 for use in templates)
- Preview your data in the table — image columns show thumbnails with a 🖼️ indicator
- Click **"Continue to Export"** to navigate directly to the PDF Export view.
- Note: You can still customize or design the template at any time by clicking "Back to Design" in the Export view, or clicking "2" in the header navigation.

### Step 2: Design Template (Optional)

- Write your HTML template in the code editor
- Switch to the **CSS** tab to style your template
- Use the **column tags** above the editor to insert `{{column_name}}` placeholders at the cursor
- For image columns (Picture, Dimension), use `<img src="{{Picture}}">` — the placeholder will be replaced with the base64 image data
- Choose from built-in templates using the dropdown, or create your own
- The **Live Preview** panel on the right shows your template rendered with actual data
- Navigate between rows using the `‹` `›` buttons to preview different records
- Click **"Continue to Export"**

### Step 3: Export PDF

- Configure page settings:
  - **Page Size**: A4, Letter, or Legal
  - **Orientation**: Portrait or Landscape
  - **Margins**: None, Narrow, Normal, or Wide
  - **Export Mode**: All rows or a specific range
- Set your desired **filename**
- Click **"Generate PDF"** to download

## 🧩 Placeholder Syntax

Use double curly braces with the Excel column header name:

```
{{column_name}}
```

**Example:** With columns `Title`, `Picture`, `Description`, `Dimension`, `Specification`:

```html
<h1>{{Title}}</h1>
<img src="{{Picture}}" alt="{{Title}}" />
<p>{{Description}}</p>
<img src="{{Dimension}}" alt="Dimension diagram" />
<p>{{Specification}}</p>
```

> **Note:** Placeholder matching is case-insensitive. `{{Title}}` and `{{title}}` both work.

> **Note:** For image columns, the `{{placeholder}}` resolves to a base64 `data:image/...` URL, so use it directly in `<img src="...">` tags.

## 📁 Expected Excel Format

Your Excel file should have:
- **Row 1**: Column headers (Title, Picture, Description, Dimension, Specification)
- **Row 2+**: Data rows with text and embedded images

| Column        | Type   | Description                                        |
|---------------|--------|----------------------------------------------------|
| Title         | Text   | Product/item name                                  |
| Picture       | Image  | Embedded image in the cell (extracted automatically)|
| Description   | Text   | Detailed product description                       |
| Dimension     | Image  | Dimension diagram/image embedded in the cell       |
| Specification | Text   | Technical specifications                           |

> **Important:** Images must be **embedded** in the Excel cells (Insert → Picture → Place in Cell), not linked or floating.

## 🛠 Tech Stack

| Technology      | Purpose                        |
|-----------------|--------------------------------|
| [Vite](https://vite.dev/) | Dev server & build tool |
| [ExcelJS](https://github.com/exceljs/exceljs) | Excel parsing with image extraction |
| [CodeMirror 6](https://codemirror.net/) | Code editor with syntax highlighting |
| [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) | HTML/CSS → PDF conversion |

## 📂 Project Structure

```
datasheet/
├── index.html              # Main HTML shell (3-step wizard)
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── README.md               # This file
└── src/
    ├── main.js             # App entry point & navigation
    ├── style.css           # Design system & styles
    └── modules/
        ├── csvParser.js    # Excel upload, parsing & image extraction
        ├── templateEditor.js # CodeMirror HTML/CSS editor
        ├── templateStore.js  # Built-in & saved templates
        └── pdfGenerator.js   # Preview rendering & PDF export
```
