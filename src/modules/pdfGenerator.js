/**
 * PDF Generator Module
 * Handles live preview rendering and PDF generation via html2pdf.js
 */
import html2pdf from 'html2pdf.js';

export class PDFGenerator {
  constructor(csvParser, templateEditor) {
    this.csvParser = csvParser;
    this.templateEditor = templateEditor;
    this.currentPreviewRow = 0;

    this._bindElements();
    this._bindEvents();
  }

  _bindElements() {
    // Step 2 preview
    this.previewFrame = document.getElementById('preview-frame');
    this.prevRowBtn = document.getElementById('btn-prev-row');
    this.nextRowBtn = document.getElementById('btn-next-row');
    this.rowIndicator = document.getElementById('preview-row-indicator');

    // Step 3 export preview
    this.exportPreviewFrame = document.getElementById('export-preview-frame');
    this.exportPrevBtn = document.getElementById('btn-export-prev-row');
    this.exportNextBtn = document.getElementById('btn-export-next-row');
    this.exportRowIndicator = document.getElementById('export-row-indicator');

    // Export controls
    this.pageSizeSelect = document.getElementById('page-size');
    this.orientationSelect = document.getElementById('orientation');
    this.marginSelect = document.getElementById('margin');
    this.exportModeSelect = document.getElementById('export-mode');
    this.rangeGroup = document.getElementById('range-group');
    this.rangeStart = document.getElementById('range-start');
    this.rangeEnd = document.getElementById('range-end');
    this.filenameInput = document.getElementById('filename-input');
    this.generateBtn = document.getElementById('btn-generate-pdf');

    // Progress
    this.progressSection = document.getElementById('progress-section');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
  }

  _bindEvents() {
    // Row navigation — Step 2
    this.prevRowBtn.addEventListener('click', () => {
      if (this.currentPreviewRow > 0) {
        this.currentPreviewRow--;
        this.updatePreview();
      }
    });

    this.nextRowBtn.addEventListener('click', () => {
      if (this.currentPreviewRow < this.csvParser.getRowCount() - 1) {
        this.currentPreviewRow++;
        this.updatePreview();
      }
    });

    // Row navigation — Step 3
    this.exportPrevBtn.addEventListener('click', () => {
      if (this.currentPreviewRow > 0) {
        this.currentPreviewRow--;
        this.updateExportPreview();
      }
    });

    this.exportNextBtn.addEventListener('click', () => {
      if (this.currentPreviewRow < this.csvParser.getRowCount() - 1) {
        this.currentPreviewRow++;
        this.updateExportPreview();
      }
    });

    // Export mode toggle
    this.exportModeSelect.addEventListener('change', () => {
      const isRange = this.exportModeSelect.value === 'range';
      this.rangeGroup.classList.toggle('hidden', !isRange);
    });

    // Generate PDF
    this.generateBtn.addEventListener('click', () => this._generatePDF());
  }

  /**
   * Format Specification column text into a clean HTML table
   */
  _formatSpecification(specStr) {
    if (specStr === undefined || specStr === null || specStr === '') return '';
    
    const spec = String(specStr);
    
    // Check if it's already HTML (e.g. contains table tags) to prevent double encoding
    if (spec.includes('<table') || spec.includes('<div') || spec.includes('<tr')) {
      return spec;
    }
    
    // Split by newlines or HTML line breaks
    const lines = spec.split(/\r?\n|<br\s*\/?>/gi)
      .map(line => line.trim())
      .filter(Boolean);
      
    if (lines.length === 0) return '';
    
    const tableRows = [];
    let isTableLike = false;
    
    for (const line of lines) {
      // Match "Key: Value" or "Key - Value" or "Key | Value"
      const match = line.match(/^([^:\-\|]+)[:\-\|](.+)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        tableRows.push(`<tr><td class="spec-key">${key}</td><td class="spec-val">${val}</td></tr>`);
        isTableLike = true;
      } else {
        tableRows.push(`<tr><td colspan="2" class="spec-text">${line}</td></tr>`);
      }
    }
    
    if (isTableLike) {
      return `<table class="specs-table"><tbody>${tableRows.join('')}</tbody></table>`;
    }
    
    return lines.map(line => `<div class="spec-line">${line}</div>`).join('');
  }

  /**
   * Replace {{placeholders}} in template with actual row data
   */
  _replacePlaceholders(templateStr, rowData) {
    if (!templateStr) return '';
    return templateStr.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      // Case-insensitive, trimmed header match
      const header = Object.keys(rowData).find(
        (h) => h.trim().toLowerCase() === trimmedKey.toLowerCase()
      );
      
      if (!header) return match;
      
      const value = rowData[header] ?? '';
      
      // If the column name is "Specification", auto-convert it to table
      if (trimmedKey.toLowerCase() === 'specification') {
        return this._formatSpecification(value);
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
    const blob = new Blob([doc], { type: 'text/html' });
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
   * Get page size dimensions
   */
  _getPageFormat() {
    return { format: 'a4', orientation: 'portrait', width: 210, height: 297 };
  }

  /**
   * Helper to wait for all images in a container to load/decode
   */
  _waitForImages(container) {
    const images = Array.from(container.querySelectorAll('img'));
    const promises = images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    return Promise.all(promises);
  }

  /**
   * Generate PDF from all (or selected range of) rows
   */
  async _generatePDF() {
    const rowCount = this.csvParser.getRowCount();
    if (rowCount === 0) return;

    let startRow = 0;
    let endRow = rowCount - 1;

    if (this.exportModeSelect.value === 'range') {
      startRow = Math.max(0, (parseInt(this.rangeStart.value) || 1) - 1);
      endRow = Math.min(rowCount - 1, (parseInt(this.rangeEnd.value) || rowCount) - 1);
    }

    const totalRows = endRow - startRow + 1;
    const margin = 0;
    const filename = 'datasheet';
    const format = 'a4';
    const orientation = 'portrait';

    // Show progress
    this.progressSection.classList.remove('hidden');
    this.generateBtn.disabled = true;
    this.progressFill.style.width = '0%';
    this.progressText.textContent = `Preparing ${totalRows} page(s)...`;

    let container = null;
    try {
      // Build a combined container with all pages
      container = document.createElement('div');
      container.className = 'pdf-export-container';
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.zIndex = '-9999';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';

      // Enforce layout width based on page format and orientation for scaling accuracy
      const formatWidths = {
        a4: 794,
        letter: 816,
        legal: 816,
      };
      let targetWidth = formatWidths[format] || 794;
      if (orientation === 'landscape') {
        const formatHeights = {
          a4: 1122,
          letter: 1056,
          legal: 1344,
        };
        targetWidth = formatHeights[format] || 1122;
      }
      container.style.width = `${targetWidth}px`;

      // Append to DOM so html2canvas can compute layouts and load images properly
      document.body.appendChild(container);

      for (let i = startRow; i <= endRow; i++) {
        const rowData = this.csvParser.getRow(i);
        const htmlTemplate = this.templateEditor.getHTML();
        const cssTemplate = this.templateEditor.getCSS();

        const htmlContent = this._replacePlaceholders(htmlTemplate, rowData);

        const pageDiv = document.createElement('div');
        pageDiv.className = 'pdf-page';
        pageDiv.innerHTML = htmlContent;
        container.appendChild(pageDiv);

        // Apply CSS via style tag (only once)
        if (i === startRow) {
          const styleTag = document.createElement('style');
          styleTag.textContent = this._replacePlaceholders(cssTemplate, rowData);
          container.prepend(styleTag);
        }

        const progress = ((i - startRow + 1) / totalRows) * 50;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `Building page ${i - startRow + 1} of ${totalRows}...`;

        // Yield to keep UI responsive
        await new Promise((r) => setTimeout(r, 0));
      }

      this.progressText.textContent = 'Waiting for images to load...';
      await this._waitForImages(container);

      this.progressText.textContent = 'Generating PDF...';
      this.progressFill.style.width = '60%';

      // Generate PDF
      const opt = {
        margin: margin,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const clonedContainer = clonedDoc.querySelector('.pdf-export-container');
            if (clonedContainer) {
              clonedContainer.style.opacity = '1';
              clonedContainer.style.visibility = 'visible';
            }
          }
        },
        jsPDF: {
          unit: 'mm',
          format: format === 'a4' ? 'a4' : format === 'letter' ? 'letter' : 'legal',
          orientation: orientation,
        },
        pagebreak: { mode: ['css', 'legacy'], avoid: '.pdf-page' },
      };

      // For multi-page: use page breaks
      const wrapperStyle = document.createElement('style');
      wrapperStyle.textContent = `
        .pdf-page {
          width: 100%;
          box-sizing: border-box;
          page-break-after: always;
          page-break-inside: avoid;
        }
        .pdf-page:last-child {
          page-break-after: auto;
        }
      `;
      container.prepend(wrapperStyle);

      await html2pdf().set(opt).from(container).save();

      this.progressFill.style.width = '100%';
      this.progressText.textContent = 'PDF generated successfully!';

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: `PDF "${filename}.pdf" downloaded! (${totalRows} pages)`,
            type: 'success',
          },
        })
      );
    } catch (error) {
      console.error('PDF generation error:', error);
      this.progressText.textContent = `Error: ${error.message}`;
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `PDF generation failed: ${error.message}`, type: 'error' },
        })
      );
    } finally {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      this.generateBtn.disabled = false;
      setTimeout(() => {
        this.progressSection.classList.add('hidden');
      }, 3000);
    }
  }
}
