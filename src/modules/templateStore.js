/**
 * Template Store Module
 * Manages default templates and localStorage persistence
 */

const STORAGE_KEY = 'datasheet-templates';

const DEFAULT_TEMPLATES = {
  default: {
    name: 'Default Template',
    html: `<div class="datasheet-container">
  <!-- Header -->
  <header class="ds-header">
    <img src="data:image/png;base64,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" class="ds-header-img" alt="Header Logo" />
  </header>
  
  <div class="ds-gradient-bar"></div>

  <!-- Title section -->
  <div class="ds-title-section">
    <h1>{{Title}}</h1>
    <p class="ds-subtitle">LED DOWNLIGHT</p>
  </div>

  <div class="ds-divider"></div>

  <!-- Content Grid -->
  <div class="ds-content">
    <div class="ds-left-col">
      <div class="ds-desc">
        <p>{{Description}}</p>
      </div>
      <div class="ds-specs">
        <h2>LUMINAIRE SPECIFICATION</h2>
        <div class="ds-specs-table-container">
          {{Specification}}
        </div>
      </div>
    </div>

    <div class="ds-right-col">
      <div class="ds-image-box main-pic">
        <img src="{{Picture}}" alt="{{Title}}" />
      </div>
      <div class="ds-image-box dim-pic">
        <img src="{{Dimension}}" alt="Dimensions" />
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="ds-footer">
    <img src="data:image/png;base64,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" class="ds-footer-img" alt="Footer Contact Details" />
  </footer>
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
  font-family: 'Inter', sans-serif;
  color: #333333;
  background: #ffffff;
}

.datasheet-container {
  width: 100%;
  min-height: 100%;
  padding: 30px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: #ffffff;
}

.ds-header {
  width: 100%;
  margin-bottom: 12px;
}

.ds-header-img {
  width: 100%;
  height: auto;
  display: block;
}

.ds-gradient-bar {
  height: 4px;
  background: linear-gradient(90deg, #139B58 0%, #8BC34A 100%);
  margin-bottom: 20px;
  width: 100%;
}

.ds-title-section {
  margin-bottom: 12px;
}

.ds-title-section h1 {
  font-size: 28px;
  font-weight: 800;
  color: #139B58;
  line-height: 1.1;
  text-transform: uppercase;
}

.ds-subtitle {
  font-size: 12px;
  font-weight: 700;
  color: #555555;
  letter-spacing: 2px;
  margin-top: 4px;
}

.ds-divider {
  height: 1px;
  background-color: #139B58;
  opacity: 0.3;
  margin-bottom: 24px;
  width: 100%;
}

.ds-content {
  display: flex;
  gap: 30px;
  flex: 1;
}

.ds-left-col {
  width: 58%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ds-right-col {
  width: 42%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.ds-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #444444;
}

.ds-specs h2 {
  font-size: 13px;
  font-weight: 800;
  color: #139B58;
  border-bottom: 1.5px solid #139B58;
  padding-bottom: 6px;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.ds-specs-table-container {
  width: 100%;
}

/* Specification Table Styling */
.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid #e0e0e0;
}

.specs-table tr:last-child {
  border-bottom: none;
}

.specs-table td {
  padding: 8px 6px;
  font-size: 12px;
  vertical-align: top;
}

.specs-table td.spec-key {
  font-weight: 700;
  color: #333333;
  width: 40%;
}

.specs-table td.spec-val {
  color: #555555;
}

.spec-line {
  font-size: 12px;
  padding: 6px;
  border-bottom: 1px solid #f0f0f0;
  color: #444444;
}

/* Image styling */
.ds-image-box {
  width: 100%;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ds-image-box img {
  max-width: 100%;
  object-fit: contain;
}

.main-pic {
  height: 220px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
}

.main-pic img {
  max-height: 200px;
}

.dim-pic {
  height: 180px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
}

.dim-pic img {
  max-height: 160px;
}

/* Hide image container when source is empty or missing */
.ds-image-box:has(img[src=""]), 
.ds-image-box:has(img:not([src])),
img[src=""], 
img:not([src]) {
  display: none !important;
}

/* Footer Styling */
.ds-footer {
  margin-top: auto;
  width: 100%;
}

.ds-footer-img {
  width: 100%;
  height: auto;
  display: block;
}
`,
  },

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

  datasheet: {
    name: 'Data Sheet',
    html: `<div class="datasheet-container">
  <!-- Header -->
  <header class="ds-header">
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAxoAAABiCAIAAABYuzI0AAAAtGVYSWZJSSoACAAAAAYAEgEDAAEAAAABAAAAGgEFAAEAAABWAAAAGwEFAAEAAABeAAAAKAEDAAEAAAACAAAAEwIDAAEAAAABAAAAaYcEAAEAAABmAAAAAAAAAGAAAAABAAAAYAAAAAEAAAAGAACQBwAEAAAAMDIxMAGRBwAEAAAAAQIDAACgBwAEAAAAMDEwMAGgAwABAAAA//8AAAKgBAABAAAAGgMAAAOgBAABAAAAYgAAAAAAAABmwIghAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAD82lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTA1LTIxPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUhCU3VCZEx0SSZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBR3pNSHpIYmhZJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0JBRjlwYy0xOHhBJnF1b3Q7fTwvQXR0cmliOkRhdGE+CiAgICAgPEF0dHJpYjpFeHRJZD4wOTQ2ZDBlYS1kMTcyLTQ5NjEtOTJiNy1mYWQ2YWE4MjA4MzE8L0F0dHJpYjpFeHRJZD4KICAgICA8QXR0cmliOkZiSWQ+NTI1MjY1OTE0MTc5NTgwPC9BdHRyaWI6RmJJZD4KICAgICA8QXR0cmliOlRvdWNoVHlwZT4yPC9BdHRyaWI6VG91Y2hUeXBlPgogICAgPC9yZGY6bGk+CiAgIDwvcmRmOlNlcT4KICA8L0F0dHJpYjpBZHM+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOmRjPSdodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyc+CiAgPGRjOnRpdGxlPgogICA8cmRmOkFsdD4KICAgIDxyZGY6bGkgeG1sOmxhbmc9J3gtZGVmYXVsdCc+Qy1EMTAgLSAxPC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CjwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9J3InPz55tFNnAAAgAElEQVR4nO2dB3wUxf7ADxQpAuZyd9t379L7JXfpjXSSkAIBghDBQCgJkF5JAoQQICIovUrvoUgVUXgBAQMoiOU95YFdLPxRgYf68Fny/+1NOCMIyjufgeP3/Sz3mZudnZ27DDff3ZmdUQgIgiAIgiDInaPVah955JH8/HxFW5cEQRAEQRDkngR1CkEQBEEQxCJQpxAEQRAEQSwCdQpBEARBEMQiUKcQBEEQBEEsAnUKQRAEQRDEIlCnEARBEARBLAJ1CkEQBEEQxCJQpxAEQRAEQSwCdQpBEARBEMQiUKcQBEEQBEEsAnUKQRAEQRDEIlCnEARBEARBLAJ1CkEQBEEQxCJQpxAEQRAEQSwCdQpBEARBEMQiUKcQBEEQBEEsAnUKQRAEQRDEIlCnEARBEARBLAJ1CkEQBEEQxCJQpxAEQRAEQSwCdQpBEARBEMQiUKcQBEEQBEEsAnUKQRAEQRDEIlCnEARBEARBLAJ1CkEQBEHaBtFEW5cC+RNAnUIQBEGQNgBEiuM4mqHbuiDInwDqFIIgCIL81YBLsSzr5OTk7+0v8G1dGsRiUKcQBEEQ5C+FuJSLs8vKCSvWj10b4OpPczT2+t3ToE5ZA9j7jiAIcg8hiZKtxrbgsYLdJTsX9J/X0zuOYinpd37G8Xf+rua+0ynxOm1dkD8T3kRblwJBEAT5Q8AvNrS+83Pnrhu2ZsHAeREePSj2lnenIFYrihzLamiaw5/6u5X7S6fI/VWGYTiOsyajsj5BRBAEsVZEQWQ51tnReWnO4jWZq57qP8Pg5MNwjCRKEuz9tTBJoshzXHe12tHZOcroa6/Vcm1VbuS23Ec6JUmSUqkcOHDg/v37AwICaPqe76gmdujm5tbY2Dhu3Lhu3brBn7OtC4UgCILcEnCpFp1ycF46YtHaoasr4kvtRJ0g8CzLqTiWlZ2qBa0oqilK6+BQ1bf/sUGZX0UnzdFwNMeJwr3deFkl95FOARzHHT58uLm5ecqUKaBW97p8gE4xDKPX669cuTJ//vxOnTrpdLq2LhSCIAhyS+AaGH66eZ7XSbrZGU8/k7E40TuOBZViOVdX1/XpAwtFndokTOBSSoqKDQw8kjnyS0PoBw8pzyo6VHbqwggoU3cj94tOwecEf8rMzPz5559Bp86dO+fu7k6qdVsX7b+H6JSHh8e77747ffr0Ll26oE4hCILcDcgjMCRJEE3bL7GCm4sby7HyDSqejfAIS9THaUWJ5zlakjZG9fyassvt3FUjijpBtKXpvkEhZ0NiPu6sfkfR4R+KLgvaddJrKNJumbL/JefWYTOtx9Sabx/8ZsqbgWRwCJyFvP533wA5130ytPd+0SnBdE3wwgsv/PDDD6dOnQKjqqqq6t69+71+g0owVXqj0ejm5sZx2KWOIAjS9sgjMRiao1SCxpZnKHgviZJKo0pPTN9WuTnKK5JiaYhR0pruckBUMvTQoNCLWrftCkWwrYqVJIphehiMZ4Ki3lN0+me7h99q1/Xpdp38lSrmutrAD76NjQ0xFXhVqVTwShwIXkkquMA2y5BSqSQFs7W1JSkJpMBaE+a3EIAMu3XrptFounbtStO0OWeyl+Rpfkv2mj87SQlHqdVq4Q8L3L3OfaFTpGakpqb+9NNPTU1NcXFxly9fPnPmjKOjo3WMSYdaC7LY1qVAEARBWlxK7x8cU1jvkzVBawgRaLUk6Wwp24K0vJ1jni3tWcTznIplU318s+2dGZbViOJWQ+C5B7rndOjCye4l0Dy/LSD8onxfqkujonPpg509KIqRWu5LwQ++h4fHxIkT7e3tGYZxcXGpq6uDV2jOH374YXCgzp07l5SUVFRUKBQKkCdo6UaOHCmYxGvatGnOzs6QEjwJ1AraR4iEMMiT2ckgkJiYuHz58k2bNi1ZsiQ0NJTkTFEUnB0kCU5KAlASeO1uQrje2nY1kZaWlm0CygaHW71U3Rc6BX91qF4rV65sbm4uKCjo2LHjxo0bIZybm3urEVTS73GzhJlqecv2R3q27yj97YvR+qoCQRAEaUskiVUr9cMnqp4+2bn2YNeqXWpjlJalVYwmNSBly8hN45OqtKJWLQq7Ants66qGq2FQmKndVBPad3KWr4x5Rh5tLk7rartV0fGJ9p3ju9tIHGcem0Ieq0pP73/ixHEIQ+sWHBw8c+ZMCPTt2xfcZeDAgaBZ69atW7ZsWVFRkaOjY+/eva9e/SY/vyA5ORl0ys/PDwKVlZVgPGA/kElpaWlhYSEkg8Q2NjapqalnzpyB5hKSzZ8/PyEhISQkZPr06fAK8hQfH+/t7Q3ilZSUBFbXq1cvcKa8vDyIAT9LSUmZMmWKj49PTk5OVlbW3LlzyVgUK+gLuj3Wr1NQA0GoAwMDr1y58vbbb0Mlg4oIlQB06vDhw0TMb3AjiNH8HpBnq1PIPsQxPEtxLAWvPM+abOkWhtM6PaPhWQ1cO/x2etL3DOWB0/1mMUgHHwTItcKf+9UhCIIgdwz8bNMqZfxwRfXf2hU/q6je3/GxqYIsSIK91j43anRG4ECW43U63UuSy8wHurCmHjs7hnHgOaWGFiU7X097XuDhEDeKsmPl7kCh1bN80Gx37twZHGXjxo3Qfnfr1q2+vh50CoSmqanp6aef/uSTT1JSZB9av379q6++umDBggkTJkBkdXX19u3bx48fX1xc/Pnnn0P8Bx98EBoaCpFr167dvXv3yZMnSW/ggQMHxo0bp1AoaJp+4IEHMjMzjx49Cl71yiuv+Pv7Q7IAE42NjRkZGRcuXCBZPfbYY1VVVXDs0qVLZ8+evXnzZmhq9+zZ079/f3IbrC3/KP97rF+nyCeEqgb+VFFRAd4NlRj8eteuXRCTnp5O3NycXn7gQqeLiIiI/C2iTcTExICkk/SiJDJgNSzvYtTpIxyNic7w6uCmlW2J5kXtTTexJEFOz3AuRjt9pKMx3hle7V2vp5d+SU/0CGohBIKCgqKioqBU8EoKEGXCwcEB9kLB4FLgXh9ZjyAIYiXIfWa6jukTFOV7FBXPte9bDZfYcFHM8vIje3aijhN4SRJXP2w7vJM88Nx0OS0q1UxokN/xhX13FzMST8tRWrl7T+Q5SeDNP+7EeMB+SkpKoHWDi23wqmnTph05csTV1RXevvTSSxkZg0CAHnroIZCnOXPmlJWVrVy5EvRoy5Ytubm5kD4rKwucDA6ZO3fuzp07YRe0j2BFDz74IAgTuJenpydZoRlaltOnT/fu3btdu3b79++HZM8//zwcO3HixIULF0LODQ0NcDjkOWPGDDi1h4dH+/btvby8IJyYmAg+5+TkdD80T1auU/D3A7n29vb+8ssvP/zwQ4PBwDAM2BLURagcoFNg5aQz2Jye3Mq6dOnStWvXvv322+9a8e9///vq1atffPHF999/v3XrVnJDiFFzhjin+EKf5HHGmBx9YrEhNkefVGHsmeftYrCDvb+65yQKtIozxMrpk8qNcWO9E4p84sZ49yo39sz/VXryJC1UQaj6r7322r/+9S8ozA8//PDNN99cvHgRPg4pUkJCgr29PXy0J598Euo3PtmHIAhyF2CafFMQugWldIoc/Ih7oJ1OGxESqdVKDMeQFLDXR61xZlgyWEpDsXFhPp+uiX1tXOde+i6cIHEs84gSFEwStPYaVsuSTgzTwClnZ+djx47p9XryQNWLL75YWFjY2NioVqvr6upIHx+YEwjQs88+C43Ihg0bBg8eDA3f8ePH09PTm5qa4Kj+/ftDGtCsVatWderUae/evcXFxRCAbD///HMwoQ4dOoAJ5eTknD17FlrGkJCQI0cO19dPW7FiBfjTc889N2bMmOXLl8OpNRoN2Ft1dTVkAkoBEpaZmblt27aRI0fCKe6HW1OC1esUfDwbG5spU6aAOT311FPkRhSZQ5w86AfxUVFRUAXJH5vIONRUqB+lpaUlrYC38DVNnTr1P//5z5UrV8DG4FJD4IXwIR59p/hHDPWMHe0dX+CTUilLVdgg94hMT4g39nQGQzJXJI7lw4d4pk32jxzmGZ2tTyg2Sdhofeggj4hhcnowM1rFSlr5ggR0Da4qoIRvvvnm5MmTCwoKpk+f/s4775BuyuzsbCiku7u7m5vbV199NW/ePJx3CkEQ5K5BvkyXWFrieZpW9fAN31ezty691knnyPEt83DCFTnXMuuBoGH4Z7K124Y/0MO1K8dLthrGzd29Jrvn5vE9DtcHrMrhXOxojhehBQN3CQ8PP3/+PPgKyAq0DtCWeXh47DHxySef5OXlLVy4cNKkSd26dXv55ZdjY2NBpw4ePFhVVbVv3z6wqAMHDnTt2nXmzJn19fV+fn7QxGzfvh2u0iMiImgoq0oFx545c2bBggUnTpyoqKjYuHEjyNPRoy+PGjUqIyPj3LmzkCEUIDU1FRojaIYiIyNBp3x9fSH95s2bYS8YXk1NDQjW/PnzH374YasfOCVYt06ZH384d+7cv/71L/h7Qy00P9gJvgz6DGqyfv16pVLZ2p3BqED5u7WCvIX6BxYPh5SVlSltlRwthAxw71PrHzta3zPfO7XaN26Md2KxT1KFsc8kP4jp8bhH3zp/rwhHWsWBITEaLjjdLW2yX0y2Pr7AO7nSNz7fJ8F0W6v3JL+EAp8eQzz6TfHXRzpylGCrUg4fPhzOtXjxYvAqODWUASolqN7u3buvXr0KFtixY0eo+l5eXhcuXADxQp1CEAS5e+B4gaYpecYEnteK2qzQYbP7PZXgE09fX56v9WNIvCAYHW1ddDQraDUU0z/e9+OVsc2r+J/nd7j6hGLLsHbu9jRrGugLLZSLi0tCQkK/fv3AjWJiYnx8fIKCgkaPHl1bW/vGG2/06NEDzAYaC8gWGj54BeMBDQJbMhgMEIbE0Hb4+/tD85Genp6TkwPt4I4dO8yLhUBbCRKWlZUFh4Bd2dvbDxs2DE5EBp/AeVNSUkJDQ6EYIHaknQ0ODlar1ZAhpIRIyBwijUajXq+/H3r6BOvWKeJMRUVFICUNDQ1QP8A2zDNkwF8Xattrr732/fffQ+UzmxZB+2ugMlEUNW3aNMhq7dq1NPz3oHnPEMfeNX5xY70TSw3Ro/RgRVEjvBKKDNEj9SnVviBMvcoMPTI902r97F20jJrzCHKQ0+fK8VEjvZLKDDE5+vhCn5hR+pQqXwj0KjVEPO7Zp0ZOT2noV145AcWDwpAOSiiGnZ0dqa+XL1+Gqk8WH/T09Py///s/1CkEQZC7Brmvz14r+YZGeASGabU6jmN4ntfbeznpnOVh5r8Fw0kcL2olwZbiZw2VPq7tcHisYkNmu8KYjl4OGtmlrqeEX35oC2xNgANBK96rV69t27atWbMGXIdMZEAeVCJPTYHQ2NjYkIeWIEy0CcKQcsKECdCazJ49G7wHYsx3HCAxZEtaRjgEruchMenAgZMqlUrIhDwmRRKQuakgB5KS7CWL5N4PLiVYsU6RsUfgHydOnPjPf/4TEhLSsWNHqAQ21wHj7tChQ3Z2NhjS/PnzbxiQ3hoyozpcBPz888+nTp2CPFmO5SgBFKpXuZHcXuqZ5xOTrQdPSqn0hdeIoZ7Jlcb4Ip+oEXqQrcDerppH2MjhXknlhoQi06ipPO/oUV5wIGyQCUmfUAiapU8sMhiTHF0c3b7793f19fU3TOVA/mBbtmw5e/asg4MDVGWwK9QpBEGQuwjQDpaJLpkZ+swplznH1ZlTTXMcCgzPcvwt51uWOwdFQacVtVpJJzIhrspgN5VOZGlWYHnpl4l1TGlbT5cDr+Tpb2jIyA0kgnD9kSaSxhxvHtxCRrWD+kCbSLwH8jFPDUoSQIyLiws0N9C+2NvbOzk5weEQILYkmG5lkZTkEJ0JaKoYE/eJSwlWrFPk1tSQIUPAlr744ot58+Yt/DWLFi2CyNWrV//0008fffSRv7//b/7hSTWFvZ9++unly5djYmLkgVaipLUXU6p9e+b7JJYY5LtNI7xSx/uGDnLvme8dMUy+wyT36BX69JnkFznUM3aMtygJyVVGiAGd6lVqiIb01b5hj7n3zDOln+QXO0YPTtZvqn/MKH3kKHcPd89r165Nnjz5hkF8UE3B/deuXfv+++87OjqiTiEIgtyFgBh171+hyF6hyFr0YGIuL9kJ19c/vtUhsm+xXNfumq7dKRtbTsNKDCfxpvtVPMcxDMuw8sZzPLQJWumGY38RrDsqJzEhMnkh2FhRUVFYWBjYUnp6usHgExERER8fP3r06ODgYGhxysrKhg4d6ubmBm0rhCEAB9bWTrazs3N3d09KSgItCwkJKS0t7datW+/evYuLi8k9rf/qK7zHsFqdIs/0HThwAHTqzJkzH/wWH3744bsmIM2kSZNufvqA3NiEikLyyc3NhTTwlXEM72ywS640Rg33ApcCeYov8EkqN8SN9e5T6xc71jTGvNKYWCqbVmSWF6iVq59dSpUxepRXQrGh7xR/sC6Qqrg8bzgWjEoew15llM2s3Bg72jt2tF6Q+HfefqexsRHEX7g+USe8svJy4xIU/oUXXiC3bbGzD0EQ5K6DB+0RNK4GlauR0dqzNMUxlHDr1euIS3nrnSaXxk8rjx6QoteZuiXARNQU6+Dk5OXh5unu6u7qrLOzV2o4pYYlR/0pQLNC5udcsWJFWlpaXFxcVlZWdnZ2YmIihKF9iY2NBUOqqanR6/VBQUF79uyZOnUKtI/gVdu3b/f29h4wYECvXr0eeuih/v37Dxs2DNrfJUuWwIF/TvnuBaxTp8iksVAnwIH279/v6urq/Fu4uLiAbvv6+p4/f/7s2bM3rzlDbP3pp5+GfJYtW0YsW3Yshncx2qXW+CUUygPPY8d4R430AisCGUoZL1tRyAB3eQaEXJMt5ct65OZvD2FwKRCs+Hwf8LCY0fKQKbCopHJjYF+3xGKwMX2fWn84PKHAqFTbjBtXCectKSmBSgynNt/InTVrFsQPHz6cLAiAOoUgCHL3IN8o0so9diJcA/OcwFCsWuml93Y0BnOSTrjFwCmtJDxiy+cNdmx+Q/fTW3TzG/zGukdEgaMYriAz7uyK5E8WGT9ZoP9god+pp0NWlQb1i3JjeZHm/hyjImNjysrK8vLyRowYAV41adIkeAuelJKSAhaVmZkJySASWqKMjIxx48ZBGwStZ0VFBTRSvXolTpw4sbCwENrQCRMmREREgGaNHj0a3ALa3/tkDTTr1CnS3bt7927QDlBs+ISkl/dmIB721tfXQ8oxY8ZA2DxQiXw1cDjsOnbsGJhKy+MJosCzvIObtk+trErgTMlVvmBUvWv8wgd7JJbK8071fyIQtCmhWL7nFD7EMyZbb+ciQfr4Ih9ImTreFwSr90Tf8CEeIE/gVf2m+idVGOR7VON9wbTixnhDpYQCgPXD2detWwdqGBUVBZX4ueeeI25Hxv3h3SkEQZC7B/KzrOzeTW2rpFRKjmW1OrvEseN7LT2qHrNI4+Au8eytlhXjBVEnMqnhXcoyHhyf+eDghG4cxzs76i4scf9hVruvpyquTFNcqVd8N7P9jwu6frdE3F4kuDuwrYeo/9eQ+asBaDqdnJwgJiQkxNHRET5LYGCAXq8nTRK56QAJ5IUCXWUE07h4e3t7Nze3gIAACEBiBwcHeAtZkWe5+Fvfk7MmrFCnyE3LxMTE77///vTp0/B3JWs6ir8FWfU6ODj466+/fuutt8iKLoLpe1GpVNHR0V999RXICri2eW4qAscKPcF+qo2gQaBEsEVmeYJdyQOqcuUpEkCnksYZwZAih3mGpLvTtlzPPEjvm2yKND0M6AVq1ZI+0xNySK409iyQh1IFp7txtHyrGCp3VVXVpUuXQKF++OGHH3/88cKFC7W1tWTQH3mMAnUKQRDkbgBaFLXKFkwiq6iidM6KzLp5OgdHB2OotmKtIiGvu4uveItbU2Yh4nhRQ2s1tESzEsWIphjhqX4dL05RfDuz3dUZ7a482e6resXFqYpL9e2a5yjKE7vaaG5efeM38hel39kEEXSOl7QSL8ij5mmG5k1TtzMMzXCMnAaaHYjRQjoO4jm5M1NOKcmLecAbFlJCDizLyM818pykJSs287c7rxWNqrJCnSK3ppYvXw4KUl5e3vqG063SgyqR9MOHDyer0JBpZ0+ePAmRY8eOtbW1hchfJEwrMWrOt5dL6gTf2NHyzOYJpummksrluQ8ihnmljPdNKJRvTQX3d+v3hL+Lr53mEdaY4AzxMaP1CcUG2MCokk1zfkZC+mrfhCJDcpVvUD+3tFo/F6Mdx8D/Ig4uBerq6j788MN9+/ZVV1f36dPH3d0dSmt+5gJ1CkEQ5G5AvpJXKhP69F109MyCs9/Pere5ovF9V/9QmmE0kr1p+VVTnxdRm1bA7znDtHSHmUb9shTFKW05juO1kqxTHM+nBSiXZTz4aoniwxrFV9MUX9crLkxRvDha0dNbSf9qiMqNkFOxNE+pOBo29W03zS8bQ/GMhodIeCWBlgS/JONb3qohAGm4lmQk3rzd5nQqefqIWw/Nv8ewNp0iLhUUFPTll19+9NFHLi4uvzuBmHkI3o8//tjY2EgiaZpesWIFuNTChQuVSuXNfYUQA/WgZ648ojy+wEeeMaHIR57Ds9wIbgSS1LfOP3qUPq3OL3SgOy0vHSOPuIrL9Ta5lPxwn5y+xJBYZgAnixrllSan9+o7xT8swwNczfQEiLh79+6LFy8mJyfDhwLPg3KSO67mZ19RpxAEQdockwZR/sEhS187P/nN76qOf1l++Hxs7kTTNOYSrVGrbbpzpsYIfsPhrXlMOjQlWknr5eMGEfK1vYZJTQzYt2HAtFKDm7Ok0gikU8SWlhiW93GkEgy2jwY98nhYt37+3X2d1dwtZ11omVUBhAZaE89Au+hHXZNzPFNG3y0bFKZPvldAnKO8WK1VGJW16RT5PHV1dWBCNTU1oCB/ZG57coOKjLXq27fvQw89VFJSAuFDhw6BkNnZ2Tk6Ojr8Gp1O7g/WOogJJT7En2LHyBOdJ5imQojO1kNM74l+EZmeHGv6byPK/3209gLp1Isd7R2X60PGV4GNwVs4pM8kv/DHPcG65GWVGYZMd97U1ARl6969u0qlAsmDeNLNR7oviU598cUXs2fPRp1CEARpEyStzrZ718fGTZ1xrrnspfO5z56MHFkm2TuAJ2hUqojYuMJZyzxDIhlKo5OkgqeXBvfOoFS2klZLaZiQSOPsw+mhA3ieFrvacDPGuTd/zP78Ov3Bc9rkKMZWLU+UIJkmUIfGQc1IoFa2tGjLSAx/uzkXoMUBUwFfGTrVULAyoGxDcHlDcPmm4IqGkLJNQcUb/MobQuCtHNgUDDGlGwMr5BgIBMBmipFfKxpCyV7zBm9LIM2mQDgQ0kC2pgOD72gr2xhcsTnYP8aBoVCn7j6IXpB5mC5evGgwGMxT5t8eMklVcnIyKNS2bdvi4uK+/fZbCF+6dOnTTz+F3C604rPPPvvmm29mzZplq7KVe411QtQIr5RqY++J8gDzqJFe8nQJk/3BjfxTXDj6V/Pf8vKUt0LUcM+UKiMZNRU9UvawtMl+aXX+cnq2JT0UCS5ipk6dCuc6ffr0jBkzsrKyoqKi4NPB3wxKSyarJZ/38uXL8+fPR51CEARpG0zzdjp5+4Vm5ASlD3P2DWGh9RFEcKnopN5L375SdfAD7+gkm84PpQ0f++TJi55RSSyl0eq0LMO7GaXC3XbDlvOOrryGEkONqr+vUjQfUTSfav/53gdDjTR1fUpEeaBSq+1WjZvsUqzczZdW6FW6IbhkXVDRqqD85f55y3wLVgSOWepTsCJo/IbE3GeMuct8IQBvi1YEl6+JhF2QrGJtNGz5ywNKV/coWB44eqk3hItXhZWuCi9eGUoiK9fFQQDiy9ZEyvk8YyxcHgTxf3DLXxZYsjZoSJ1Py+0Gq8CqdIrMix8bG7tx48bc3Nw7XSeI6MvMmTPT09NXrFixZMkSeF29evWqXwORkP+oUaMoipLXARcESsk6e+vCTMsYx+R4Rwz1Ckh1tXeRaBV3Y6+w6S1lyzrpdaGD3MHD5Ek7syC9i72r1pyejDRXwTVNRERTUxOI3c8mrl279vXXX587d27Dhg0JCQnkTpWTkxOUefDgwTesPIggCIL8dchz6NCMRsVSagiIpktiV1fXp4+cqzz2ZWTOeEHS8Qxd1XDwsYU7Ba0dXF5TFPyGCwzF964U8nbz3tEMRwlqRorwp/Y+9cClvYp/H1AUDuyqVIt39tMuX5Xzj1Z6V2wJKVwVVLQ6OH+l34SGhHe/eG3ytrT6HQNefXfvy2efXdZYeugfG068u2fd0Ukv/3PbsbPbNx97YlPT1GNnd648OG7r8Sff+LDx9AcH5jw/av3RSTtPzYP4d84f23ZiZuM/1h14c9XSA0WH32k4+d7zx8/trt2amr/Kr3hNcNGaoD+yQanKNgWHpjrTGk60llbLqnSKQESELFRkxjzj/g20jocA2BgcCB6mboWqFeYYct+rZQyTPC5KYNQcS3FwTcBQHKPmeVAj7W+c1TSUXR5H1Sq9HBY4gcgZcSlg9uzZX3755d69e6urq4cOHTpw4MAhQ4YUFBQsXrz4woUL3333XVZWFpkKiyyQdJ/MPIsgCHJ3Qh4Xh3+C/KLV2NpEDxhafeST+LLp9u56ltY4urrnrDkQOGA4S1MCL4XH+Tq4SAwlOHsJPQs0HiEUz0o6naChRQcd+2jcI2P7dfbz0PCCVh6Bdf359N8pgySPl0rM8qjcFlq4Orh4bXDpurAxy712nZr32aVzyw6WHj2zdc6+EcMW60CGNrxcm7lImvP8iDc+OrjlxPRDb28Arzr5/r4nd2UcPtMwfdeghS+OPX5u5/Fzu6ob4hqOTYNMStYFQz67T81/YufA1z9qHLPCa/9bq7efnJW9zA1OBKf73Q30rmJzyJDJBmu6NSVYpeLHprAAAAvgSURBVE4J16fbF0xqJVzvBCRPw5EE5jWJyAKN5gPNM/STSfcF08qR5kpMAnDBQZJx8qz/5nVpeDLuz3Q+8sSpQDIn61Cazw7eIwgtT6Wani81rTsgiZCYpIScbWxsJk2a1NzcXFpaCoZn+2u6d+/u6en59ttvnzlzxs7OjpQHXQpBEOQugnT/6Y1+qYN0zm7Q2JALZmf/UJ2jk1qpiU0NmtkUH5PNsnDtz0HbAZfUnK2KhsZKp5VnTFBRIngVwwpwAQ8NAVnY+PZrtsAelubdjbritUGlG4JL1weXbQjLX21Y8GLOexdee+Ojv7345vLXP9oPUjX52dQT7+7a9srMSduSNh6re+ezpncvvAaa9fb5o8+/sXTeCyP/+fmJxQfyG/+xdt+bz7zxUePYVV4gWEsO5D+xa8B7F06vOzphyd/y3/z44Nx9I099sO/JPRmFa/zKNoSWrg+5/QY2VrYxpGh1kLuvzmoGoROsUKfIYixEmMhYIoqi9Hq9s7MzcSMysRjUSLLMkIeHB4kUrs/ARhKA99jb2xsMBrOTwS7IELISTFZE5isjetR68k+iYvDq6uoK3kOmRCPrw0BWPj4+xJzIKUyLx8jLArq5uTk6OpJzQYLXX3+9qakJ/hcJ11eYMQPFBqMqKSm5du1aYGCg3OdoTVUSQRDEOjAZFUtpBNOyxwzFiLyW1VCixGuUbOaEsMrDTinVlOliW54NQRR1/VOD/A2OSrU8STpcJvM85+rqAi304MGDBw0aFBwcPGDAgNv85su3ptRcWoG+emdYyYbgsk0h5Q2hheuNG5pqZu7NqNuZuv5YzbKXiv9+/vCWV6bPeXH4Gx//7bnXF6w+Mm7u/hFLDuYvaczf+8bCpnPPrjoy7sA/Vp54b/fal8fX7Ujd8kp94XrfhhNTa3ckP7FnwLF3d7zw5jNLDxYcPbsVEi84kF2wzlDeEAan+51to7xVbQ8LTXWiVNbTzUewKp0i3V6xsbFFRUVKpRJspqamBmpqVlbWokWLqqurQYaSk5MfffTRPn36PP744+BSmzZteuqpp0CMSktLIf2oUaPKy8shfVpaGrydNWvWjBkz+vfvT5wJks2cOXP69OngWN7e3nPmzFm4cCHUcrCfsrIyMCdIVlBQEBYWBucCi4I8d+/eHRkZGR8fP3z4cNgL8YsXLybrA44fPx6Ogv8hPXr0SExMXLt27ZAhQ8yzx7755puHDh0ia4PfoFPwKR5++OGJEyd+9913fn5+qFMIgiB3J6YZbyTTsCphVGnfvAURDp6cwEu0hnu81n/cQac+k2jSU6FUMbWl4c3vhXxxgOvXk255oM+00Bk0GRkZGXPnzq2qqnryySdvM0xWnm1BErPn+lduA7kJBZeCraIhrGRjIGxlDSElmwKKNvjCVrzRr9gUKNrgX7wxoLQhqHQTJAgq3ghv/SAMr+BhBet9yhtCILJic2iJ6SG+soZgOIo82QdpCtb5wNuKzWHkXLfbNoVCJuN3hfd83F0eMmV1rZZV6RRZqq9v37719fUPPvigl5fXM888A5YDpuLv7w/huLg4EKkXX3zxhRdeAG2CNFA1IT0cNX/+fDAkkKHGxkZwIEg2duxY+F4GDhw4b94881rIoFCrVq2CPMGEIIGzs/PSpUvhFZzMzc0NZA4C4eHhK1asgMRk5cguXboMHTq0uLgYLiyWLFnStWtX2Au7JkyY8NJLL23dujUqKgp8a9euXXl5eWQSBCgPmfUqOzsbjEpponUgISHhq6++OnLkCPngqFMIgiB3J6BKals6ZWDEzKb43F2cfwrD0gKt4tKK3ccdckwZT5GxIhQtPLfUufnkA81Nigv7Hggx0Bpa1OnksR9whQ9NRm5u7hNPPAHX/LccKSsKHMvbO0vFa0Mqnw0btyVs3NaWrXJbeOW2HqZXEiDhHlUtYfMu8155V1VLAjm+JZOtsIVdPyrclCACXs0nutUGvlW9MxxKFT3QjUyFZX1Ym06ByINq7NixIzExEfxmwYIFOp2urq5u2rRpO3fu7NGjB8hTdXU1yE1JSckDDzxQU1OTlJQEgjJz5ky9Xj9ixIicnJyXX365X79+YDnk/tOsWbNIP529vT18U3v27IFMYmNjYRdcNEBuYFqLFy+GABQAsl20aBFIFahVdHQ0iF3nzp0fe+wxEDU4HKStsrISEoOBVVRUwAXH4cOH4f9JUFDQ8uXLly1bRnoJ4X+L0Wg8ffo0GNXx48ehGHBUUVERvEL40KFDP/300/vvv9+zZ08yXUJbf/EIgiDIb2OaqNOuYkV8/nPCiHWcTyzF0QJDCb49xbxdQtRIDc9CSyzY2IrPTFA1n25/rbF986uKXU92uj4/gryaHumXME15eMvZcOQeQ4Z39tSWbwqt3hFetb3ttmfBnEyb7GHhUJiafRH5y4P8oh3BI6318t+qdEowVVyocKA7oDJQ/0BTSMyjjz4aEhIC8uHh4eHu7u7i4uLj4wPW4uvrC2HwoYCAADIuytHR0d/fHwKQOCYmBrIiw73JA3eQba9evSAlHAtGNWDAAMgcZCsyMrJ///4gTHA4nAsOpygKnAmyYhgGzmgwGCBDkKTBgwdDGGQLdkE+pABOTk5wIthrHo0Oh3t6etbW1jY1NX322WeXL1++evXqpUuXPv74Y7C9KVOmQGLs5kMQBLmbESVRo2aikvxqDgSP2cFnPsO5+NIcI5LbM76JlLORJjqlVImDeqmbj7X7+XC75iPtvj+o6B2lttXIUySYn50i3PJcprtTTh7a8oaw6l09qna00bbdtO3oAWWoeT5y8oGois1haYV6O0fRtEDIX/bd/9VYm04JpjpHZrkUrj9GR2KIfJAlYswP5ZmfvIOUpoWT5LcQJnNWkafqWldf8ngFeUzPvLd1GA5XKpXs9cUEyFnII37kdDY2NvBKZuA0nxGAw294xlBellyphMKQ1bnByeAVjA0+CMSTTP7ybxdBEAT5o0haUfUI03d0YMWLrrk7hD6TaFHHyk+Am3SKpYSWdfxMw57sdPzfN3ZoPq744VD75hOK9ZM6UXTLWjHCraf7+QVRHvKucxDHbQ2f+lLM5L9F1zW2wTYFtoNRk/dHTXwucsyioJQcL1dvHaWSW1rybKO1YoU6ZZ7RQLg+qOiGmBt23fy2deQNcxDckNUN4ZsPufksN5eNBG6e7MCcmNgYgYgazoyAIAhyDyAKHC0Mqwso3mc3Zisf+piGbbXoryj+MohIKwk2Kmlkmm3zK4ofX2rX/HK7f6xr7+4EV/93/GOfnO01uNZ30HhjxoQ22NLLfKAA0QPdDWEO8PE0ttCAySunWeV4qdZYoU5ZGeJNtHWJEARBkD8MJ46Y7V32N7tHZ1FOPjTHCLcSC4imGeHZ+k7NpxTNTe3Pb1f08FNTzB3f02Eojta02UapOI0NCxbFUPLs7KZJFi3/Eu8BUKcQBEEQ5H+CPBGUSogaKg1fw/j1VvHc7eYBB21iWNHNmX3+qQ4/H1YcnqfwcqH+i7tTpH+wzTZJlLTykK/77dofdQpBEARB/lfwnCDpOJcA2vQ40+8kJkallbghid3jQ5QM+5cUEfkzQJ1CEARBkP8hYFEc/Ufv1ciLlfGirUaimPvs9s49DuoUgiAIgvwvEe+s5wsS34edZfc6qFMIgiAIgiAWgTqFIAiCIAhiEahTCIIgCIIgFoE6hSAIgiAIYhGoUwiCIAiCIBaBOoUgCIIgCGIRqFMIgiAIgiAWgTqFIAiCIAhiEahTCIIgCIIgFoE6hSAIgiAIYhGoUwiCIAiCIBaBOoUgCIIgCGIRqFMIgiAIgiAWgTqFIAiCIAhiEahTCIIgCIIgFoE6hSAIgiAIYhGoUwiCIAiCIBaBOoUgCIIgCGIRqFMIgiAIgiAWgTqFIAiCIAhiEahTCIIgCIIgFoE6hSAIgiAIYhGoUwiCIAiCIBaBOoUgCIIgCGIRv+iUiCAIgiAIgtw5Op3OxsZG1ikOQRAEQRAEuXPAqLp165abm6uwRxAEQRAEQe4cJycnjUZTXFys+ABBEARBEAT5r3jvvfcuXrz4/+guVhN9IYlMAAAAAElFTkSuQmCC" class="ds-header-img" alt="Header Logo" />
  </header>
  
  <div class="ds-gradient-bar"></div>

  <!-- Title section -->
  <div class="ds-title-section">
    <h1>{{Title}}</h1>
    <p class="ds-subtitle">LED DOWNLIGHT</p>
  </div>

  <div class="ds-divider"></div>

  <!-- Content Grid -->
  <div class="ds-content">
    <div class="ds-left-col">
      <div class="ds-desc">
        <p>{{Description}}</p>
      </div>
      <div class="ds-specs">
        <h2>LUMINAIRE SPECIFICATION</h2>
        <div class="ds-specs-table-container">
          {{Specification}}
        </div>
      </div>
    </div>

    <div class="ds-right-col">
      <div class="ds-image-box main-pic">
        <img src="{{Picture}}" alt="{{Title}}" />
      </div>
      <div class="ds-image-box dim-pic">
        <img src="{{Dimension}}" alt="Dimensions" />
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="ds-footer">
    <img src="data:image/png;base64,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" class="ds-footer-img" alt="Footer Contact Details" />
  </footer>
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
  font-family: 'Inter', sans-serif;
  color: #333333;
  background: #ffffff;
}

.datasheet-container {
  width: 100%;
  min-height: 100%;
  padding: 30px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: #ffffff;
}

.ds-header {
  width: 100%;
  margin-bottom: 12px;
}

.ds-header-img {
  width: 100%;
  height: auto;
  display: block;
}

.ds-gradient-bar {
  height: 4px;
  background: linear-gradient(90deg, #139B58 0%, #8BC34A 100%);
  margin-bottom: 20px;
  width: 100%;
}

.ds-title-section {
  margin-bottom: 12px;
}

.ds-title-section h1 {
  font-size: 28px;
  font-weight: 800;
  color: #139B58;
  line-height: 1.1;
  text-transform: uppercase;
}

.ds-subtitle {
  font-size: 12px;
  font-weight: 700;
  color: #555555;
  letter-spacing: 2px;
  margin-top: 4px;
}

.ds-divider {
  height: 1px;
  background-color: #139B58;
  opacity: 0.3;
  margin-bottom: 24px;
  width: 100%;
}

.ds-content {
  display: flex;
  gap: 30px;
  flex: 1;
}

.ds-left-col {
  width: 58%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ds-right-col {
  width: 42%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.ds-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #444444;
}

.ds-specs h2 {
  font-size: 13px;
  font-weight: 800;
  color: #139B58;
  border-bottom: 1.5px solid #139B58;
  padding-bottom: 6px;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.ds-specs-table-container {
  width: 100%;
}

/* Specification Table Styling */
.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid #e0e0e0;
}

.specs-table tr:last-child {
  border-bottom: none;
}

.specs-table td {
  padding: 8px 6px;
  font-size: 12px;
  vertical-align: top;
}

.specs-table td.spec-key {
  font-weight: 700;
  color: #333333;
  width: 40%;
}

.specs-table td.spec-val {
  color: #555555;
}

.spec-line {
  font-size: 12px;
  padding: 6px;
  border-bottom: 1px solid #f0f0f0;
  color: #444444;
}

/* Image styling */
.ds-image-box {
  width: 100%;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ds-image-box img {
  max-width: 100%;
  object-fit: contain;
}

.main-pic {
  height: 220px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
}

.main-pic img {
  max-height: 200px;
}

.dim-pic {
  height: 180px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
}

.dim-pic img {
  max-height: 160px;
}

/* Hide image container when source is empty or missing */
.ds-image-box:has(img[src=""]), 
.ds-image-box:has(img:not([src])),
img[src=""], 
img:not([src]) {
  display: none !important;
}

/* Footer Styling */
.ds-footer {
  margin-top: auto;
  width: 100%;
}

.ds-footer-img {
  width: 100%;
  height: auto;
  display: block;
}
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
  }

  getTemplate(key) {
    // Check saved first, then defaults
    if (this.saved[key]) return this.saved[key];
    if (DEFAULT_TEMPLATES[key]) return { ...DEFAULT_TEMPLATES[key] };
    return DEFAULT_TEMPLATES.default;
  }

  saveTemplate(key, html, css) {
    this.saved[key] = {
      name: `Custom: ${key}`,
      html,
      css,
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
