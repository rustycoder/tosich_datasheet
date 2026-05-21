/**
 * PDF Generator Module
 * Handles live preview rendering and PDF generation via html2canvas + jsPDF
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** CSS pixels per millimeter at 96 DPI */
const MM_TO_PX = 96 / 25.4;

export class PDFGenerator {
  constructor(csvParser, templateEditor) {
    this.csvParser = csvParser;
    this.templateEditor = templateEditor;
    this.currentPreviewRow = 0;

    this._bindElements();
    this._bindEvents();
    this._initStagingRoot();
  }

  /**
   * Persistent off-screen root — reusing it avoids append/remove flicker per page
   */
  _initStagingRoot() {
    this.stagingRoot = document.getElementById("pdf-staging-root");
    if (!this.stagingRoot) {
      this.stagingRoot = document.createElement("div");
      this.stagingRoot.id = "pdf-staging-root";
      this.stagingRoot.setAttribute("aria-hidden", "true");
      document.body.appendChild(this.stagingRoot);
    }
    this._exportContainer = null;
  }

  _bindElements() {
    // Step 2 preview
    this.previewFrame = document.getElementById("preview-frame");
    this.prevRowBtn = document.getElementById("btn-prev-row");
    this.nextRowBtn = document.getElementById("btn-next-row");
    this.rowIndicator = document.getElementById("preview-row-indicator");

    // Step 3 export preview
    this.exportPreviewFrame = document.getElementById("export-preview-frame");
    this.exportPrevBtn = document.getElementById("btn-export-prev-row");
    this.exportNextBtn = document.getElementById("btn-export-next-row");
    this.exportRowIndicator = document.getElementById("export-row-indicator");

    // Export controls
    this.pageSizeSelect = document.getElementById("page-size");
    this.orientationSelect = document.getElementById("orientation");
    this.marginSelect = document.getElementById("margin");
    this.exportModeSelect = document.getElementById("export-mode");
    this.rangeGroup = document.getElementById("range-group");
    this.rangeStart = document.getElementById("range-start");
    this.rangeEnd = document.getElementById("range-end");
    this.filenameInput = document.getElementById("filename-input");
    this.generateBtn = document.getElementById("btn-generate-pdf");

    // Progress
    this.progressSection = document.getElementById("progress-section");
    this.progressFill = document.getElementById("progress-fill");
    this.progressText = document.getElementById("progress-text");
  }

  _bindEvents() {
    // Row navigation — Step 2
    this.prevRowBtn.addEventListener("click", () => {
      if (this.currentPreviewRow > 0) {
        this.currentPreviewRow--;
        this.updatePreview();
      }
    });

    this.nextRowBtn.addEventListener("click", () => {
      if (this.currentPreviewRow < this.csvParser.getRowCount() - 1) {
        this.currentPreviewRow++;
        this.updatePreview();
      }
    });

    // Row navigation — Step 3
    this.exportPrevBtn.addEventListener("click", () => {
      if (this.currentPreviewRow > 0) {
        this.currentPreviewRow--;
        this.updateExportPreview();
      }
    });

    this.exportNextBtn.addEventListener("click", () => {
      if (this.currentPreviewRow < this.csvParser.getRowCount() - 1) {
        this.currentPreviewRow++;
        this.updateExportPreview();
      }
    });

    // Export mode toggle
    this.exportModeSelect.addEventListener("change", () => {
      const isRange = this.exportModeSelect.value === "range";
      this.rangeGroup.classList.toggle("hidden", !isRange);
    });

    // Generate PDF
    this.generateBtn.addEventListener("click", () => this._generatePDF());
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _normalizeSpecValue(val) {
    if (val === null || val === undefined) return "";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "number") return String(val);
    if (Array.isArray(val)) return val.map((v) => this._normalizeSpecValue(v)).join(", ");
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  }

  /**
   * Parse SPECS cell value as JSON — any keys allowed, no fixed schema
   */
  _parseSpecsJson(specStr) {
    if (specStr === undefined || specStr === null || specStr === "") return null;
    if (typeof specStr === "object" && !Array.isArray(specStr)) return specStr;

    let raw = String(specStr).trim().replace(/^\uFEFF/, "");
    if (!raw) return null;

    if (raw.includes("<table") || raw.includes("<tr")) return null;

    raw = raw.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    if (raw.includes('""')) raw = raw.replace(/""/g, '"');

    if (!raw.startsWith("{") && /["']?[^"':]+["']?\s*:/.test(raw)) {
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const obj = {};
      for (const line of lines) {
        const m = line.match(/^["']?([^"':]+)["']?\s*:\s*(.+)$/);
        if (m) obj[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
      if (Object.keys(obj).length > 0) return obj;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      /* fallback below */
    }

    // Loose fallback: pull any "key": "value" pairs from malformed JSON
    const obj = {};
    const pairRe = /["']?([^"':\{\},]+)["']?\s*:\s*["']?([^"',\n\}]+)["']?/g;
    let m;
    while ((m = pairRe.exec(raw)) !== null) {
      const k = m[1].trim();
      const v = m[2].trim();
      if (k) obj[k] = v;
    }
    return Object.keys(obj).length > 0 ? obj : null;
  }

  /**
   * Turn parsed SPECS object into [key, value] rows (supports nested objects)
   */
  _flattenSpecsEntries(obj) {
    const entries = [];
    for (const [key, val] of Object.entries(obj)) {
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        for (const [subKey, subVal] of Object.entries(val)) {
          entries.push([`${key} — ${subKey}`, subVal]);
        }
      } else {
        entries.push([key, val]);
      }
    }
    return entries;
  }

  /**
   * Expose every SPECS JSON key for {{placeholders}} (dynamic, per row)
   */
  _expandRowData(rowData) {
    const expanded = { ...rowData };
    const specsHeader = Object.keys(rowData).find((h) => {
      const n = h.trim().toLowerCase();
      return n === "specs" || n === "specification";
    });
    if (!specsHeader) return expanded;

    const parsed = this._parseSpecsJson(rowData[specsHeader]);
    if (!parsed) return expanded;

    for (const [key, val] of this._flattenSpecsEntries(parsed)) {
      expanded[key] = this._normalizeSpecValue(val);
    }
    return expanded;
  }

  _specsObjectToTable(entries) {
    const rows = entries.map(([key, val]) => {
      const display = this._normalizeSpecValue(val);
      return `<tr><td class="spec-key">${this._escapeHtml(key)}</td><td class="spec-val">${this._escapeHtml(display)}</td></tr>`;
    });
    return `<table class="specs-table"><tbody>${rows.join("")}</tbody></table>`;
  }

  /**
   * Format SPECS / Specification into a key-value HTML table (JSON or plain text)
   */
  _formatSpecification(specStr) {
    if (specStr === undefined || specStr === null || specStr === "") return "";

    const spec = String(specStr);

    if (spec.includes("<table") || spec.includes("<tr")) {
      return spec;
    }

    const jsonObj = this._parseSpecsJson(spec);
    if (jsonObj) {
      return this._specsObjectToTable(this._flattenSpecsEntries(jsonObj));
    }

    const lines = spec
      .split(/\r?\n|<br\s*\/?>/gi)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return "";

    const tableRows = [];
    let isTableLike = false;

    for (const line of lines) {
      const match = line.match(/^([^:\-\|]+)[:\-\|](.+)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        tableRows.push(
          `<tr><td class="spec-key">${this._escapeHtml(key)}</td><td class="spec-val">${this._escapeHtml(val)}</td></tr>`
        );
        isTableLike = true;
      } else {
        tableRows.push(`<tr><td colspan="2" class="spec-text">${this._escapeHtml(line)}</td></tr>`);
      }
    }

    if (isTableLike) {
      return `<table class="specs-table"><tbody>${tableRows.join("")}</tbody></table>`;
    }

    return lines.map((line) => `<div class="spec-line">${this._escapeHtml(line)}</div>`).join("");
  }

  /**
   * Replace {{placeholders}} in template with actual row data
   */
  _replacePlaceholders(templateStr, rowData) {
    if (!templateStr) return "";
    const data = this._expandRowData(rowData);

    return templateStr.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const header = Object.keys(data).find((h) => h.trim().toLowerCase() === trimmedKey.toLowerCase());

      if (!header) return match;

      const value = data[header] ?? "";

      if (trimmedKey.toLowerCase() === "specification" || trimmedKey.toLowerCase() === "specs") {
        const specsHeader = Object.keys(rowData).find((h) => {
          const n = h.trim().toLowerCase();
          return n === "specs" || n === "specification";
        });
        return this._formatSpecification(specsHeader ? rowData[specsHeader] : value);
      }

      return value;
    });
  }

  /**
   * Build full HTML document for a single row
   */
  _buildDocument(rowData) {
    const htmlTemplate = this.templateEditor.getHTML();
    const cssTemplate = this.templateEditor.getCSS();

    const htmlContent = this._replacePlaceholders(htmlTemplate, rowData);
    const cssContent = this._replacePlaceholders(cssTemplate, rowData);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${cssContent}</style>
</head>
<body>${htmlContent}</body>
</html>`;
  }

  /**
   * Render preview in iframe
   */
  _renderInIframe(iframe, rowData) {
    const doc = this._buildDocument(rowData);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Revoke previous URL to prevent memory leaks
    if (iframe._blobUrl) {
      URL.revokeObjectURL(iframe._blobUrl);
    }
    iframe._blobUrl = url;
    iframe.src = url;
  }

  /**
   * Update the Step 2 live preview
   */
  updatePreview() {
    const rowCount = this.csvParser.getRowCount();
    if (rowCount === 0) return;

    if (this.currentPreviewRow >= rowCount) {
      this.currentPreviewRow = rowCount - 1;
    }

    const rowData = this.csvParser.getRow(this.currentPreviewRow);
    this._renderInIframe(this.previewFrame, rowData);

    // Update controls
    this.rowIndicator.textContent = `Row ${this.currentPreviewRow + 1} of ${rowCount}`;
    this.prevRowBtn.disabled = this.currentPreviewRow === 0;
    this.nextRowBtn.disabled = this.currentPreviewRow >= rowCount - 1;
  }

  /**
   * Update the Step 3 export preview
   */
  updateExportPreview() {
    const rowCount = this.csvParser.getRowCount();
    if (rowCount === 0) return;

    if (this.currentPreviewRow >= rowCount) {
      this.currentPreviewRow = rowCount - 1;
    }

    const rowData = this.csvParser.getRow(this.currentPreviewRow);
    this._renderInIframe(this.exportPreviewFrame, rowData);

    // Update controls
    this.exportRowIndicator.textContent = `Row ${this.currentPreviewRow + 1} of ${rowCount}`;
    this.exportPrevBtn.disabled = this.currentPreviewRow === 0;
    this.exportNextBtn.disabled = this.currentPreviewRow >= rowCount - 1;
  }

  /**
   * Get page size dimensions (mm)
   */
  _getPageFormat() {
    return { format: "a4", orientation: "portrait", width: 210, height: 297 };
  }

  /**
   * Printable area inside margins, in mm and px (for capture + PDF placement)
   */
  _getExportLayout(marginMm) {
    const { width: pageWidthMm, height: pageHeightMm } = this._getPageFormat();
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const contentHeightMm = pageHeightMm - marginMm * 2;

    return {
      pageWidthMm,
      pageHeightMm,
      marginMm,
      contentWidthMm,
      contentHeightMm,
      contentWidthPx: Math.round(contentWidthMm * MM_TO_PX),
      contentHeightPx: Math.round(contentHeightMm * MM_TO_PX),
    };
  }

  /**
   * Helper to wait for all images in a container to load/decode
   */
  async _waitForImages(container) {
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) return;
        try {
          if (img.decode) await img.decode();
        } catch {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
      }),
    );
  }

  /**
   * Build a single page DOM node sized to fill the printable area
   */
  _buildPageElement(rowData) {
    const htmlTemplate = this.templateEditor.getHTML();
    const cssTemplate = this.templateEditor.getCSS();
    const htmlContent = this._replacePlaceholders(htmlTemplate, rowData);

    const wrapper = document.createElement("div");
    wrapper.className = "pdf-page-wrapper";

    const layoutStyle = document.createElement("style");
    layoutStyle.textContent = `
      .pdf-page-wrapper,
      .pdf-page,
      .pdf-page .datasheet-container {
        width: 100%;
        height: 100%;
        min-height: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
      .pdf-page .datasheet-container {
        display: flex;
        flex-direction: column;
      }
    `;
    wrapper.appendChild(layoutStyle);

    const styleTag = document.createElement("style");
    styleTag.textContent = this._replacePlaceholders(cssTemplate, rowData);
    wrapper.appendChild(styleTag);

    const pageDiv = document.createElement("div");
    pageDiv.className = "pdf-page";
    pageDiv.innerHTML = htmlContent;
    wrapper.appendChild(pageDiv);

    return wrapper;
  }

  /**
   * Reuse a single off-screen container (avoids DOM churn flicker each page)
   */
  _getExportContainer(contentWidthPx, contentHeightPx) {
    if (!this._exportContainer) {
      this._exportContainer = document.createElement("div");
      this._exportContainer.className = "pdf-export-container";
      this.stagingRoot.appendChild(this._exportContainer);
    }
    Object.assign(this._exportContainer.style, {
      width: `${contentWidthPx}px`,
      height: `${contentHeightPx}px`,
      background: "#ffffff",
      overflow: "hidden",
    });
    this._exportContainer.replaceChildren();
    return this._exportContainer;
  }

  _setExportProgress(current, total, message) {
    this._pendingProgress = { current, total, message };
    if (this._progressRaf) return;
    this._progressRaf = requestAnimationFrame(() => {
      this._progressRaf = null;
      const p = this._pendingProgress;
      if (!p) return;
      if (p.message) this.progressText.textContent = p.message;
      if (p.total > 0) {
        this.progressFill.style.width = `${(p.current / p.total) * 90}%`;
      }
    });
  }

  /**
   * Place captured content at margins, filling the full printable area
   */
  _addCanvasToPdf(pdf, imgData, layout) {
    const { marginMm, contentWidthMm, contentHeightMm } = layout;
    pdf.addImage(imgData, "JPEG", marginMm, marginMm, contentWidthMm, contentHeightMm);
  }

  /**
   * Generate PDF from all (or selected range of) rows
   */
  async _generatePDF() {
    const rowCount = this.csvParser.getRowCount();
    if (rowCount === 0) return;

    let startRow = 0;
    let endRow = rowCount - 1;

    if (this.exportModeSelect.value === "range") {
      startRow = Math.max(0, (parseInt(this.rangeStart.value) || 1) - 1);
      endRow = Math.min(rowCount - 1, (parseInt(this.rangeEnd.value) || rowCount) - 1);
    }

    const totalRows = endRow - startRow + 1;
    const marginMm = parseInt(this.marginSelect.value, 10) || 0;
    const filename = this.filenameInput.value.trim() || "datasheet-output";
    const { format, orientation } = this._getPageFormat();
    const layout = this._getExportLayout(marginMm);

    // Show progress (disable transitions via body class to prevent flicker)
    document.body.classList.add("pdf-exporting");
    this.progressSection.classList.remove("hidden");
    this.generateBtn.disabled = true;
    this.progressFill.style.width = "0%";
    this.progressText.textContent = `Preparing ${totalRows} page(s)...`;

    const jsPdfFormat = format === "a4" ? "a4" : format === "letter" ? "letter" : "legal";

    let container = null;
    this._progressRaf = null;
    try {
      const pdf = new jsPDF({
        unit: "mm",
        format: jsPdfFormat,
        orientation,
      });

      const canvasOptions = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: layout.contentWidthPx,
        height: layout.contentHeightPx,
        windowWidth: layout.contentWidthPx,
        windowHeight: layout.contentHeightPx,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll(".pdf-export-container, .pdf-page-wrapper").forEach((el) => {
            el.style.opacity = "1";
            el.style.visibility = "visible";
          });
        },
      };

      for (let i = startRow; i <= endRow; i++) {
        const rowData = this.csvParser.getRow(i);
        const pageIndex = i - startRow;

        this._setExportProgress(pageIndex + 0.5, totalRows, `Rendering page ${pageIndex + 1} of ${totalRows}...`);

        container = this._getExportContainer(layout.contentWidthPx, layout.contentHeightPx);
        container.appendChild(this._buildPageElement(rowData));

        await this._waitForImages(container);

        const canvas = await html2canvas(container, canvasOptions);
        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (pageIndex > 0) {
          pdf.addPage(jsPdfFormat, orientation);
        }
        this._addCanvasToPdf(pdf, imgData, layout);
      }

      pdf.save(`${filename}.pdf`);

      this.progressFill.style.width = "100%";
      this.progressText.textContent = "PDF generated successfully!";

      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            message: `PDF "${filename}.pdf" downloaded! (${totalRows} pages)`,
            type: "success",
          },
        }),
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      this.progressText.textContent = `Error: ${error.message}`;
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: `PDF generation failed: ${error.message}`, type: "error" },
        }),
      );
    } finally {
      if (this._exportContainer) {
        this._exportContainer.replaceChildren();
      }
      if (this._progressRaf) {
        cancelAnimationFrame(this._progressRaf);
        this._progressRaf = null;
      }
      document.body.classList.remove("pdf-exporting");
      this.generateBtn.disabled = false;
      setTimeout(() => {
        this.progressSection.classList.add("hidden");
      }, 3000);
    }
  }
}
