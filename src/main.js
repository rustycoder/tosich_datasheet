/**
 * DataSheet — Main Application Entry Point
 * Wires together all modules and handles navigation
 */
import './style.css';
import { ExcelParser } from './modules/csvParser.js';
import { TemplateStore } from './modules/templateStore.js';
import { TemplateEditor } from './modules/templateEditor.js';
import { PDFGenerator } from './modules/pdfGenerator.js';

class App {
  constructor() {
    this.currentStep = 1;

    // Initialize modules
    this.templateStore = new TemplateStore();
    this.csvParser = new ExcelParser();
    this.templateEditor = new TemplateEditor(this.templateStore);
    this.pdfGenerator = new PDFGenerator(this.csvParser, this.templateEditor);

    this._bindNavigation();
    this._bindToast();
    this._wireModules();
    this._bindShowcase();
    this._loadDefaultExcelOnStartup();
  }

  _wireModules() {
    // When Excel data is loaded, pass headers to the template editor
    this.csvParser.onDataLoaded = (headers, rows) => {
      this.templateEditor.setHeaders(headers);
    };

    // When template content changes, update live preview
    this.templateEditor.onContentChange = () => {
      if (this.currentStep >= 2) {
        this.pdfGenerator.updatePreview();
      }
    };
  }

  _bindShowcase() {
    const cards = document.querySelectorAll('.template-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const templateKey = card.dataset.templateKey;
        this._loadTemplateWithSampleData(templateKey);
      });
    });

    const tryBtns = document.querySelectorAll('.btn-try-template');
    tryBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent card click from triggering twice
        const templateKey = btn.dataset.template;
        this._loadTemplateWithSampleData(templateKey);
      });
    });
  }

  _loadTemplateWithSampleData(templateKey) {
    // 1. Select and load template in editor
    this.templateEditor.selectTemplate(templateKey);

    // 2. Load mock sample data inside the Excel parser
    this.csvParser.loadSampleData(templateKey);

    // 3. Navigate to design step
    this._goToStep(2);

    // Toast notification
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          message: `Loaded sample data for "${templateKey === 'default' || templateKey === 'datasheet' ? 'Azoogi Datasheet' : templateKey.charAt(0).toUpperCase() + templateKey.slice(1)}"!`,
          type: 'success',
        },
      })
    );
  }

  _bindNavigation() {
    // Step indicator buttons
    const stepBtns = document.querySelectorAll('.step-btn');
    stepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step);
        // Only allow navigating to steps that are accessible
        if (step <= this._getMaxAccessibleStep()) {
          this._goToStep(step);
        }
      });
    });

    // Step 1 → Step 2
    document.getElementById('btn-to-design').addEventListener('click', () => {
      this._goToStep(2);
    });

    // Step 2 → Step 1 (back)
    document.getElementById('btn-back-upload').addEventListener('click', () => {
      this._goToStep(1);
    });

    // Step 2 → Step 3
    document.getElementById('btn-to-export').addEventListener('click', () => {
      this._goToStep(3);
    });

    // Step 3 → Step 2 (back)
    document.getElementById('btn-back-design').addEventListener('click', () => {
      this._goToStep(2);
    });
  }

  _getMaxAccessibleStep() {
    if (this.csvParser.getRowCount() === 0) return 1;
    return 3;
  }

  _goToStep(step) {
    this.currentStep = step;

    // Update panels
    document.querySelectorAll('.step-panel').forEach((panel) => {
      panel.classList.remove('active');
    });
    document.getElementById(`step-${step}`).classList.add('active');

    // Update step indicators
    document.querySelectorAll('.step-btn').forEach((btn) => {
      const btnStep = parseInt(btn.dataset.step);
      btn.classList.remove('active', 'completed');
      if (btnStep === step) {
        btn.classList.add('active');
      } else if (btnStep < step) {
        btn.classList.add('completed');
      }
    });

    // Trigger preview updates when navigating
    if (step === 2) {
      // Slight delay to let CodeMirror render
      setTimeout(() => {
        this.pdfGenerator.updatePreview();
      }, 100);
    } else if (step === 3) {
      setTimeout(() => {
        this.pdfGenerator.updateExportPreview();
      }, 100);
    }
  }

  _bindToast() {
    const toastContainer = document.getElementById('toast-container');

    window.addEventListener('toast', (e) => {
      const { message, type } = e.detail;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
      toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;

      toastContainer.appendChild(toast);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    });
  }

  async _loadDefaultExcelOnStartup() {
    try {
      // 1. Fetch the generated sample excel file from local server
      const response = await fetch('/sample-datasheet.xlsx');
      if (!response.ok) throw new Error('File not found');
      const arrayBuffer = await response.arrayBuffer();

      // 2. Wrap buffer inside file mock object
      const file = {
        name: 'sample-datasheet.xlsx',
        size: arrayBuffer.byteLength,
        arrayBuffer: async () => arrayBuffer
      };

      // 3. Load spreadsheet using csvParser
      await this.csvParser._handleFile(file);

      // 4. Force default template to 'datasheet'
      this.templateEditor.selectTemplate('datasheet');

      // 5. Restore dropzone visibility (allowing replacement) and update instruction text
      this.csvParser.dropzone.style.display = '';
      
      const textEl = this.csvParser.dropzone.querySelector('.dropzone-text');
      if (textEl) {
        textEl.innerHTML = `Default <strong>sample-datasheet.xlsx</strong> loaded`;
      }
      
      const subtextEl = this.csvParser.dropzone.querySelector('.dropzone-subtext');
      if (subtextEl) {
        subtextEl.innerHTML = `Continue to Design, or drop a new file to replace it`;
      }
      
      console.log('Successfully loaded default Excel sample sheet on startup');
    } catch (e) {
      console.warn('Failed to load default sample-datasheet.xlsx on startup, falling back to static mock data:', e);
      // Fallback: select template 'datasheet' and load static sample data
      this.templateEditor.selectTemplate('datasheet');
      this.csvParser.loadSampleData('datasheet');
      this.csvParser.dropzone.style.display = '';
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
