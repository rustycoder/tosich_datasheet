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
  }

  _wireModules() {
    // When Excel data is loaded, pass headers to the template editor
    this.csvParser.onDataLoaded = (headers, rows) => {
      this.templateEditor.setHeaders(headers);
      if (this.currentStep >= 2) {
        this.pdfGenerator.updatePreview();
      }
      if (this.currentStep === 3) {
        this.pdfGenerator.updateExportPreview();
      }
    };

    // When template content changes, update live preview
    this.templateEditor.onContentChange = () => {
      if (this.currentStep >= 2) {
        this.pdfGenerator.updatePreview();
      }
    };
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

    // Step 1 → Step 3
    document.getElementById('btn-to-design').addEventListener('click', () => {
      this._goToStep(3);
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
      const key = this.templateEditor.currentTemplateKey;
      if (
        (key === 'datasheet' || key === 'default') &&
        !this.templateEditor.getHTML().includes('{{CODE}}')
      ) {
        this.templateEditor.selectTemplate(key);
      }
      setTimeout(() => {
        this.pdfGenerator.updatePreview();
        requestAnimationFrame(() => {
          this.pdfGenerator._fitPreviewMount(this.pdfGenerator.previewMount);
        });
      }, 50);
    } else if (step === 3) {
      setTimeout(() => {
        this.pdfGenerator.updateExportPreview();
        requestAnimationFrame(() => {
          this.pdfGenerator._fitPreviewMount(this.pdfGenerator.exportPreviewMount);
        });
      }, 50);
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


}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
