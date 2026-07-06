/**
 * Template Store Module
 * Manages default templates and localStorage persistence
 */

import { azoogiDatasheetTemplate } from '../templates/azoogiDatasheet.js';
import { heistSocialPostTemplate } from '../templates/heistSocialPost.js';

const STORAGE_KEY = 'datasheet-templates';
const TEMPLATE_VERSION_KEY = 'datasheet-template-version';
const TEMPLATE_VERSION = 8;

const DEFAULT_TEMPLATES = {
  default: azoogiDatasheetTemplate,
  datasheet: azoogiDatasheetTemplate,
  heist: heistSocialPostTemplate,

  certificate: {
    name: 'Certificate',
    html: `<div class="certificate">
  <div class="border-frame">
    <div class="ornament top-left"></div>
    <div class="ornament top-right"></div>
    <div class="ornament bottom-left"></div>
    <div class="ornament bottom-right"></div>
    
    <div class="content">
      <p class="pre-title">Certificate of</p>
      <h1 class="title">{{certificate_type}}</h1>
      
      <p class="presented">This is proudly presented to</p>
      <h2 class="recipient">{{name}}</h2>
      <div class="divider"></div>
      
      <p class="description">{{description}}</p>
      
      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <p>{{issuer}}</p>
          <span>Director</span>
        </div>
        <div class="date-block">
          <p class="date-value">{{date}}</p>
          <span>Date</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
    css: `@page {
  margin: 0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Georgia', serif;
  color: #2c3e50;
  background: #fff;
}

.certificate {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fefefe, #f0f0ff);
}

.border-frame {
  position: relative;
  width: 100%;
  padding: 56px 48px;
  border: 3px double #b8860b;
  text-align: center;
}

.ornament {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid #b8860b;
}

.top-left { top: 8px; left: 8px; border-right: none; border-bottom: none; }
.top-right { top: 8px; right: 8px; border-left: none; border-bottom: none; }
.bottom-left { bottom: 8px; left: 8px; border-right: none; border-top: none; }
.bottom-right { bottom: 8px; right: 8px; border-left: none; border-top: none; }

.pre-title {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #b8860b;
  margin-bottom: 8px;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 32px;
}

.presented {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  font-style: italic;
}

.recipient {
  font-size: 32px;
  font-weight: 400;
  color: #b8860b;
  font-style: italic;
  margin-bottom: 8px;
}

.divider {
  width: 180px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #b8860b, transparent);
  margin: 0 auto 28px;
}

.description {
  font-size: 14px;
  line-height: 1.8;
  color: #4a4a6a;
  max-width: 480px;
  margin: 0 auto 40px;
}

.signatures {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  margin-top: 20px;
}

.sig-block, .date-block {
  text-align: center;
}

.sig-line {
  width: 160px;
  height: 1px;
  background: #333;
  margin-bottom: 8px;
}

.sig-block p, .date-block .date-value {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.sig-block span, .date-block span {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
}`,
  },

  invoice: {
    name: 'Invoice',
    html: `<div class="invoice">
  <div class="invoice-header">
    <div class="brand">
      <h1>INVOICE</h1>
      <p class="invoice-number">#{{invoice_number}}</p>
    </div>
    <div class="invoice-meta">
      <div class="meta-item">
        <span class="meta-label">Date</span>
        <span class="meta-value">{{date}}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Due Date</span>
        <span class="meta-value">{{due_date}}</span>
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <p class="party-name">{{company}}</p>
      <p>{{company_address}}</p>
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <p class="party-name">{{client_name}}</p>
      <p>{{client_address}}</p>
    </div>
  </div>

  <div class="line-items">
    <div class="item-header">
      <span>Description</span>
      <span>Amount</span>
    </div>
    <div class="item-row">
      <span>{{description}}</span>
      <span>{{amount}}</span>
    </div>
  </div>

  <div class="total-section">
    <div class="total-row grand-total">
      <span>Total</span>
      <span>{{amount}}</span>
    </div>
  </div>

  <div class="invoice-footer">
    <p>{{notes}}</p>
  </div>
</div>`,
    css: `@page {
  margin: 0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a2e;
  background: #fff;
}

.invoice {
  width: 100%;
  min-height: 100%;
  padding: 48px;
  display: flex;
  flex-direction: column;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid #6366f1;
}

.brand h1 {
  font-size: 32px;
  font-weight: 800;
  color: #6366f1;
  letter-spacing: 2px;
}

.invoice-number {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.invoice-meta {
  text-align: right;
}

.meta-item {
  margin-bottom: 8px;
}

.meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #999;
  display: block;
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 40px;
}

.party h3 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6366f1;
  margin-bottom: 8px;
}

.party-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.party p {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.line-items {
  margin-bottom: 24px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #6366f1;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 6px 6px 0 0;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.total-section {
  margin-left: auto;
  width: 260px;
  margin-bottom: 40px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 14px;
}

.grand-total {
  background: #f8f9ff;
  border-radius: 6px;
  font-weight: 700;
  font-size: 18px;
  color: #6366f1;
}

.invoice-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.invoice-footer p {
  font-size: 12px;
  color: #999;
  font-style: italic;
}`,
  },
};

export class TemplateStore {
  constructor() {
    this._loadSaved();
  }

  _loadSaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.saved = saved ? JSON.parse(saved) : {};
    } catch {
      this.saved = {};
    }

    const version = parseInt(localStorage.getItem(TEMPLATE_VERSION_KEY), 10) || 0;
    if (version < TEMPLATE_VERSION) {
      delete this.saved.default;
      delete this.saved.datasheet;
      delete this.saved.heist;
      delete this.saved.certificate;
      delete this.saved.invoice;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
        localStorage.setItem(TEMPLATE_VERSION_KEY, String(TEMPLATE_VERSION));
      } catch {
        /* ignore quota errors */
      }
    }
  }

  getTemplate(key) {
    // Built-in datasheet templates always use latest defaults unless explicitly saved as custom
    if (DEFAULT_TEMPLATES[key] && !this.saved[key]?.custom) {
      return { ...DEFAULT_TEMPLATES[key] };
    }
    if (this.saved[key]) return { ...this.saved[key] };
    if (DEFAULT_TEMPLATES[key]) return { ...DEFAULT_TEMPLATES[key] };
    return { ...DEFAULT_TEMPLATES.default };
  }

  saveTemplate(key, html, css) {
    this.saved[key] = {
      name: `Custom: ${key}`,
      html,
      css,
      custom: true,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
    } catch (e) {
      console.error('Failed to save template:', e);
    }
  }

  getDefaultTemplateKeys() {
    return Object.keys(DEFAULT_TEMPLATES);
  }

  getAllTemplateKeys() {
    return [...new Set([...Object.keys(DEFAULT_TEMPLATES), ...Object.keys(this.saved)])];
  }

  /**
   * Adapts a template's HTML to use actual CSV headers.
   * Replaces the default placeholder names with the real column names.
   */
  adaptTemplate(templateKey, headers) {
    const template = this.getTemplate(templateKey);
    // Return as-is; users can manually adjust or use their own column names
    return template;
  }
}
