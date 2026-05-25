/**
 * PDF Generator Module
 * Handles live preview rendering and PDF generation via html2canvas + jsPDF
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** CSS pixels per millimeter at 96 DPI */
const MM_TO_PX = 96 / 25.4;

const A4_WIDTH_PX = Math.round(210 * MM_TO_PX);
const A4_HEIGHT_PX = Math.round(297 * MM_TO_PX);

/** Overrides inside preview shadow root (template html/body rules must not leak to the app) */
const PREVIEW_SHADOW_CSS = `
:host {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: transparent;
}
.preview-sheet {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.page {
  flex-shrink: 0;
  margin: 0 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  border-radius: 2px;
  transform-origin: center center;
  transition: transform 0.2s ease;
  will-change: transform;
}
`;

export class PDFGenerator {
  constructor(csvParser, templateEditor) {
    this.csvParser = csvParser;
    this.templateEditor = templateEditor;
    this.currentPreviewRow = 0;

    this._bindElements();
    this._bindEvents();
    this._initStagingRoot();
    this._bindPreviewResize();
  }

  _bindPreviewResize() {
    this._onPreviewResize = () => {
      this._fitPreviewMount(this.previewMount);
      this._fitPreviewMount(this.exportPreviewMount);
    };
    window.addEventListener("resize", this._onPreviewResize);

    if (typeof ResizeObserver !== "undefined") {
      this._previewResizeObserver = new ResizeObserver(this._onPreviewResize);
      for (const mount of [this.previewMount, this.exportPreviewMount]) {
        const wrapper = mount?.parentElement;
        if (wrapper?.classList.contains("preview-frame-wrapper")) {
          this._previewResizeObserver.observe(wrapper);
        }
      }
    }
  }

  _formatRowIndicator(currentIndex, rowCount) {
    return `${currentIndex + 1} / ${rowCount}`;
  }

  _updatePreviewNav(rowCount) {
    const text = this._formatRowIndicator(this.currentPreviewRow, rowCount);
    const atStart = this.currentPreviewRow === 0;
    const atEnd = this.currentPreviewRow >= rowCount - 1;

    if (this.rowIndicator) this.rowIndicator.textContent = text;
    if (this.prevRowBtn) this.prevRowBtn.disabled = atStart;
    if (this.nextRowBtn) this.nextRowBtn.disabled = atEnd;

    if (this.exportRowIndicator) this.exportRowIndicator.textContent = text;
    if (this.exportPrevBtn) this.exportPrevBtn.disabled = atStart;
    if (this.exportNextBtn) this.exportNextBtn.disabled = atEnd;
  }

  _getPreviewRoot(mount) {
    if (!mount) return null;
    if (!mount.shadowRoot) {
      mount.attachShadow({ mode: "open" });
    }
    return mount.shadowRoot;
  }

  _fitPreviewMount(mount) {
    if (!mount) return;
    const wrapper = mount.parentElement;
    const root = this._getPreviewRoot(mount);
    const page = root?.querySelector(".page");
    if (!wrapper || !page || wrapper.clientWidth < 1 || wrapper.clientHeight < 1) return;

    page.style.width = `${A4_WIDTH_PX}px`;
    page.style.height = `${A4_HEIGHT_PX}px`;
    page.style.transform = "none";

    const pageW = page.offsetWidth || A4_WIDTH_PX;
    const pageH = page.offsetHeight || A4_HEIGHT_PX;
    const pad = 12;
    const availW = wrapper.clientWidth - pad;
    const availH = wrapper.clientHeight - pad;
    const scale = Math.min(availW / pageW, availH / pageH);

    page.style.transform = `scale(${scale})`;
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
    this.previewMount = document.getElementById("preview-mount");
    this.prevRowBtn = document.getElementById("btn-prev-row");
    this.nextRowBtn = document.getElementById("btn-next-row");
    this.rowIndicator = document.getElementById("preview-row-indicator");

    // Step 3 export preview
    this.exportPreviewMount = document.getElementById("export-preview-mount");
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

  /**
   * Root-relative paths (e.g. /datasheet-template/...) break in blob iframes — use absolute URLs
   */
  _absolutizePublicUrls(content) {
    if (!content) return content;
    const origin = window.location.origin;
    return content.replace(/(\b(?:src|href)\s*=\s*["'])\/([^"']+)/gi, (_, attr, path) => {
      return `${attr}${origin}/${path}`;
    });
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
   * Map alternate column names (e.g. Product Code) onto CODE for {{CODE}}
   */
  _normalizeRowKeys(rowData) {
    const data = { ...rowData };
    const findKey = (pred) => Object.keys(data).find((k) => pred(k.trim()));

    const codeKey = findKey((k) => k.toLowerCase() === "code");
    const codeVal = codeKey ? String(data[codeKey] ?? "").trim() : "";

    if (!codeVal) {
      const altKey = findKey((k) => /^(product\s*code|sku|model)$/i.test(k));
      if (altKey) data.CODE = data[altKey];
    }

    return data;
  }

  /**
   * Expose every SPECS JSON key for {{placeholders}} (dynamic, per row)
   */
  _expandRowData(rowData) {
    const expanded = this._normalizeRowKeys(rowData);
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
    const tableClass = this._usesFullPageTemplate() ? "params" : "specs-table";
    const rows = entries.map(([key, val]) => {
      const display = this._normalizeSpecValue(val);
      if (tableClass === "params") {
        return `<tr><td>${this._escapeHtml(key)}</td><td>${this._escapeHtml(display)}</td></tr>`;
      }
      return `<tr><td class="spec-key">${this._escapeHtml(key)}</td><td class="spec-val">${this._escapeHtml(display)}</td></tr>`;
    });
    return `<table class="${tableClass}"><tbody>${rows.join("")}</tbody></table>`;
  }

  /** Azoogi template uses a fixed 210×297mm `.page` — export at full A4, no shrink margins */
  _usesFullPageTemplate() {
    const html = this.templateEditor.getHTML() || "";
    return /\bclass\s*=\s*["'][^"']*\bpage\b/.test(html);
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

    const useParamsTable = this._usesFullPageTemplate();

    for (const line of lines) {
      const match = line.match(/^([^:\-\|]+)[:\-\|](.+)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        tableRows.push(
          useParamsTable
            ? `<tr><td>${this._escapeHtml(key)}</td><td>${this._escapeHtml(val)}</td></tr>`
            : `<tr><td class="spec-key">${this._escapeHtml(key)}</td><td class="spec-val">${this._escapeHtml(val)}</td></tr>`
        );
        isTableLike = true;
      } else {
        tableRows.push(`<tr><td colspan="2" class="spec-text">${this._escapeHtml(line)}</td></tr>`);
      }
    }

    if (isTableLike) {
      const tableClass = this._usesFullPageTemplate() ? "params" : "specs-table";
      return `<table class="${tableClass}"><tbody>${tableRows.join("")}</tbody></table>`;
    }

    return lines.map((line) => `<div class="spec-line">${this._escapeHtml(line)}</div>`).join("");
  }

  /**
   * Replace {{placeholders}} in template with actual row data
   */
  _replacePlaceholders(templateStr, rowData) {
    if (!templateStr) return "";
    const data = this._expandRowData(rowData);

    let processedStr = templateStr;

    // Evaluate {{#if COLUMN}} ... {{/if}} blocks from inside out (recursive check)
    const ifRegex = /\{\{#if\s+([^}]+?)\s*\}\}([\s\S]*?)\{\{\/if\}\}/gi;
    let matchFound = true;
    let iterations = 0;

    while (matchFound && iterations < 10) {
      matchFound = false;
      processedStr = processedStr.replace(ifRegex, (match, key, content) => {
        matchFound = true;
        const trimmedKey = key.trim();
        const header = Object.keys(data).find((h) => h.trim().toLowerCase() === trimmedKey.toLowerCase());
        const value = header ? data[header] : null;

        if (value !== null && value !== undefined && String(value).trim() !== "") {
          return content;
        }
        return "";
      });
      iterations++;
    }

    return processedStr.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const header = Object.keys(data).find((h) => h.trim().toLowerCase() === trimmedKey.toLowerCase());

      if (!header) return "";

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
   * Build preview fragment (HTML + CSS) for a single row
   */
  _buildPreviewContent(rowData) {
    const htmlTemplate = this.templateEditor.getHTML();
    const cssTemplate = this.templateEditor.getCSS();
    const htmlContent = this._absolutizePublicUrls(this._replacePlaceholders(htmlTemplate, rowData));
    const cssContent = this._replacePlaceholders(cssTemplate, rowData);
    return { htmlContent, cssContent };
  }

  /**
   * Render preview directly in the page (fills panel, sharp, no iframe scaling bugs)
   */
  _renderPreview(mount, rowData) {
    if (!mount) return;

    const { htmlContent, cssContent } = this._buildPreviewContent(rowData);
    const root = this._getPreviewRoot(mount);
    root.innerHTML = `<style>${cssContent}\n${PREVIEW_SHADOW_CSS}</style><div class="preview-sheet">${htmlContent}</div>`;

    this._resolveAssetUrls(root);

    // Automatically hide empty image elements
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || src.trim() === "" || src.includes("{{")) {
        img.style.display = "none";
      }
    });

    requestAnimationFrame(() => {
      this._fitPreviewMount(mount);
      this._waitForImages(root).then(() => this._fitPreviewMount(mount));
    });
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
    this._renderPreview(this.previewMount, rowData);
    this._updatePreviewNav(rowCount);
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
    this._renderPreview(this.exportPreviewMount, rowData);
    this._updatePreviewNav(rowCount);
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

    if (this._usesFullPageTemplate()) {
      return {
        pageWidthMm,
        pageHeightMm,
        marginMm: 0,
        contentWidthMm: pageWidthMm,
        contentHeightMm: pageHeightMm,
        contentWidthPx: Math.round(pageWidthMm * MM_TO_PX),
        contentHeightPx: Math.round(pageHeightMm * MM_TO_PX),
        fullPage: true,
      };
    }

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
      fullPage: false,
    };
  }

  /**
   * Turn root-relative image paths into absolute URLs for off-DOM capture
   */
  _resolveAssetUrls(root) {
    root.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:") || /^https?:/i.test(src)) return;
      try {
        img.src = new URL(src, window.location.href).href;
      } catch {
        /* keep original */
      }
    });
  }

  async _waitForLayout() {
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  _getCaptureTarget(container) {
    return (
      container.querySelector(".page") ||
      container.querySelector(".pdf-page") ||
      container
    );
  }

  _applyCaptureStagingStyles() {
    this._stagingStyleBackup = this.stagingRoot.getAttribute("style");
    Object.assign(this.stagingRoot.style, {
      opacity: "1",
      visibility: "visible",
      overflow: "visible",
      transform: "none",
    });
  }

  _restoreCaptureStagingStyles() {
    if (this._stagingStyleBackup) {
      this.stagingRoot.setAttribute("style", this._stagingStyleBackup);
    } else {
      this.stagingRoot.removeAttribute("style");
    }
    this._stagingStyleBackup = null;
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
    const htmlContent = this._absolutizePublicUrls(this._replacePlaceholders(htmlTemplate, rowData));

    const wrapper = document.createElement("div");
    wrapper.className = "pdf-page-wrapper";

    const fullPage = this._usesFullPageTemplate();
    const layoutStyle = document.createElement("style");
    layoutStyle.textContent = fullPage
      ? `
      .pdf-page-wrapper,
      .pdf-page {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
      .pdf-page .page {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
    `
      : `
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

    // Automatically hide empty image elements
    pageDiv.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || src.trim() === "" || src.includes("{{")) {
        img.style.display = "none";
      }
    });

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
      minWidth: `${contentWidthPx}px`,
      minHeight: `${contentHeightPx}px`,
      background: "#ffffff",
      overflow: "hidden",
      opacity: "1",
      visibility: "visible",
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
  _addCanvasToPdf(pdf, imgData, layout, canvasWidthPx, canvasHeightPx) {
    const pxPerMm = MM_TO_PX;
    const imgWidthMm = canvasWidthPx / pxPerMm;
    const imgHeightMm = canvasHeightPx / pxPerMm;

    if (layout.fullPage) {
      pdf.addImage(imgData, "JPEG", 0, 0, layout.pageWidthMm, layout.pageHeightMm);
      return;
    }

    const { marginMm, contentWidthMm, contentHeightMm } = layout;
    const scale = Math.min(contentWidthMm / imgWidthMm, contentHeightMm / imgHeightMm);
    const drawW = imgWidthMm * scale;
    const drawH = imgHeightMm * scale;
    const offsetX = marginMm + (contentWidthMm - drawW) / 2;
    const offsetY = marginMm + (contentHeightMm - drawH) / 2;
    pdf.addImage(imgData, "JPEG", offsetX, offsetY, drawW, drawH);
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

      const canvasScale = 2;

      for (let i = startRow; i <= endRow; i++) {
        const rowData = this.csvParser.getRow(i);
        const pageIndex = i - startRow;

        this._setExportProgress(pageIndex + 0.5, totalRows, `Rendering page ${pageIndex + 1} of ${totalRows}...`);

        container = this._getExportContainer(layout.contentWidthPx, layout.contentHeightPx);
        container.appendChild(this._buildPageElement(rowData));

        this._resolveAssetUrls(container);
        await this._waitForImages(container);
        await this._waitForLayout();

        const captureTarget = this._getCaptureTarget(container);
        this._applyCaptureStagingStyles();

        let canvas;
        try {
          canvas = await html2canvas(captureTarget, {
            scale: canvasScale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            imageTimeout: 15000,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
              clonedDoc.querySelectorAll(".pdf-export-container, .pdf-page-wrapper, .pdf-page, .page").forEach((el) => {
                el.style.opacity = "1";
                el.style.visibility = "visible";
              });
              clonedDoc.querySelectorAll("img[src]").forEach((img) => {
                const src = img.getAttribute("src");
                if (src && src.startsWith("/")) {
                  try {
                    img.src = new URL(src, window.location.href).href;
                  } catch {
                    /* ignore */
                  }
                }
              });
            },
          });
        } finally {
          this._restoreCaptureStagingStyles();
        }

        if (!canvas.width || !canvas.height) {
          throw new Error("Page render failed (empty canvas). Check template images and reload the page.");
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (pageIndex > 0) {
          pdf.addPage(jsPdfFormat, orientation);
        }
        this._addCanvasToPdf(pdf, imgData, layout, canvas.width, canvas.height);
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
