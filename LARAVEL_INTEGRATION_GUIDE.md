# Laravel Datasheet PDF Integration Guide

This guide contains everything required to implement Azoogi-style A4 datasheet PDF generation in a **Laravel** backend project using **Spatie Browsershot (Puppeteer)**.

---

## 1. Prerequisites & Installation

In your Laravel project root:

```bash
# 1. Install Spatie Browsershot
composer require spatie/laravel-browsershot

# 2. Install Puppeteer (Headless Chrome for Node.js)
npm install puppeteer --save-dev
```

> **Note for Linux Servers / Docker / Forge / Vapor:**
> Make sure Chromium and required system dependencies are installed:
> ```bash
> sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 libpangocairo-1.0-0 libxss1 libgtk-3-0
> ```

---

## 2. Blade Views

Create the following files in `resources/views/datasheets/`:

### `resources/views/datasheets/azoogi.blade.php`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ $projectName ?? 'Datasheet' }}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      font-family: "Open Sans", "Helvetica Neue", Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      position: relative;
      width: 210mm;
      height: 297mm;
      margin: 0;
      background: #ffffff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
    }

    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .az-header {
      background: #0e0e0e;
      color: #ffffff;
      padding: 7mm 10mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #000;
    }
    .az-header .logo-left { height: 14mm; max-width: 45%; object-fit: contain; }
    .az-header .project-title { font-size: 13pt; font-weight: 600; color: #73bf44; }

    .title-block { padding: 6mm 10mm 0; }
    .title-block h1 {
      margin: 0;
      font-size: 24pt;
      font-weight: 700;
      color: #111;
      letter-spacing: .3px;
    }
    .title-block h2 {
      margin: 0 0 3mm;
      font-size: 14pt;
      font-weight: 700;
      color: #73bf44;
    }

    .gradient-line {
      height: 2px;
      background: linear-gradient(90deg, #73bf44 0%, #73bf44 35%, rgba(103,208,78,0) 100%);
      border: 0;
      margin: 0 10mm;
    }

    .body-wrap {
      flex: 1;
      position: relative;
      padding: 6mm 10mm 4mm;
      background: #ffffff;
      min-height: 0;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      position: relative;
      z-index: 1;
    }

    .desc {
      font-size: 10px;
      line-height: 1.55;
      color: #2a2a2a;
      text-align: justify;
      margin: 0 0 6mm;
    }

    .params-title {
      font-size: 9pt;
      font-weight: 700;
      color: #111;
      margin: 0 0 2mm;
    }

    table.params {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      border: 1px solid #ffffff;
    }
    table.params td {
      padding: 2mm 3mm;
      border-top: 1px solid #ccc;
      vertical-align: middle;
    }
    table.params tr td:first-child {
      font-weight: 700;
      width: 38%;
      background: #ffffff;
      color: #111;
    }
    table.params tr:nth-child(odd) td { background: #f6f6f6; color: #111; }
    table.params tr:nth-child(even) td { background: #ffffff; color: #111; }

    .product-img-container {
      height: 78mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dim-img-container {
      height: 55mm;
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .product-img, .dim-img {
      max-width: 100%;
      max-height: 100%;
      height: auto;
      width: auto;
      object-fit: contain;
      display: block;
    }

    .dim-title {
      text-align: center;
      margin: 0 0 3mm;
      font-size: 9pt;
      font-weight: 700;
      color: #111;
    }

    .az-footer {
      background: #0e0e0e;
      color: #ffffff;
      padding: 5mm 10mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 4mm;
      font-size: 8.5pt;
    }
    .az-footer .f-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #e6e6e6;
    }
  </style>
</head>
<body>
  @foreach($products as $product)
    @include('datasheets.partials.page', ['product' => $product, 'projectName' => $projectName])
  @endforeach
</body>
</html>
```

### `resources/views/datasheets/partials/page.blade.php`
```html
<section class="page">
  <header class="az-header">
    @if(!empty($product['logo_url']))
      <img class="logo-left" src="{{ $product['logo_url'] }}" alt="Logo">
    @elseif(!empty($logoUrl))
      <img class="logo-left" src="{{ $logoUrl }}" alt="Logo">
    @endif

    @if(!empty($projectName))
      <span class="project-title">{{ $projectName }}</span>
    @endif
  </header>

  <div class="title-block">
    @if(!empty($product['code']))
      <h1>{{ $product['code'] }}</h1>
    @endif
    @if(!empty($product['name']))
      <h2>{{ $product['name'] }}</h2>
    @endif
  </div>
  <hr class="gradient-line">

  <div class="body-wrap">
    <div class="content">
      <div>
        @if(!empty($product['description']))
          <p class="desc">{{ $product['description'] }}</p>
        @endif

        @if(!empty($product['specs']))
          <p class="params-title">SPECIFICATIONS</p>
          @include('datasheets.partials.specs-table', ['specs' => $product['specs']])
        @endif
      </div>

      <div style="display: flex; flex-direction: column;">
        @if(!empty($product['image']))
          <div class="product-img-container">
            <img class="product-img" src="{{ $product['image'] }}" alt="{{ $product['name'] ?? 'Product' }}">
          </div>
        @endif

        @if(!empty($product['diagram']))
          <div class="dim-img-container">
            <div class="dim-title">DIMENSIONS</div>
            <img class="dim-img" src="{{ $product['diagram'] }}" alt="Dimensions">
          </div>
        @endif
      </div>
    </div>
  </div>

  <footer class="az-footer">
    <span class="f-item">sales@azoogi.com</span>
    <span class="f-item">1300 641 261</span>
    <span class="f-item">www.azoogi.com.au</span>
    <span class="f-item">Unit 47, 10-12 Girawah Place, Matraville, NSW, 2036</span>
  </footer>
</section>
```

### `resources/views/datasheets/partials/specs-table.blade.php`
```html
@php
  $specsList = [];
  if (is_array($specs)) {
    $specsList = $specs;
  } elseif (is_string($specs)) {
    $decoded = json_decode($specs, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
      $specsList = $decoded;
    } else {
      $lines = preg_split('/\\r?\\n|<br\\s*\\/?>/i', $specs);
      foreach ($lines as $line) {
        $parts = preg_split('/[:\\-|]/', $line, 2);
        if (count($parts) === 2) {
          $specsList[trim($parts[0])] = trim($parts[1]);
        } elseif (trim($line) !== '') {
          $specsList[trim($line)] = '';
        }
      }
    }
  }
@endphp

@if(count($specsList) > 0)
  <table class="params">
    <tbody>
      @foreach($specsList as $key => $val)
        <tr>
          <td>{{ $key }}</td>
          <td>{{ $val }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
@endif
```

---

## 3. Service Layer (`app/Services/DatasheetPdfService.php`)

```php
<?php

namespace App\Services;

use Spatie\Browsershot\Browsershot;
use Illuminate\Support\Facades\View;

class DatasheetPdfService
{
    /**
     * Generate PDF binary content for given project and products.
     *
     * @param string $projectName
     * @param array $products Array of product objects
     * @param string|null $logoUrl Optional header logo URL
     * @param string|null $customView Optional custom blade view
     * @return string Binary PDF string
     */
    public function generate(string $projectName, array $products, ?string $logoUrl = null, ?string $customView = null): string
    {
        $viewName = $customView ?: 'datasheets.azoogi';

        $html = View::make($viewName, [
            'projectName' => $projectName,
            'products'    => $products,
            'logoUrl'     => $logoUrl,
        ])->render();

        return Browsershot::html($html)
            ->format('A4')
            ->margins(0, 0, 0, 0)
            ->showBackground()
            ->waitUntilNetworkIdle()
            ->pdf();
    }
}
```

---

## 4. Controller (`app/Http/Controllers/DatasheetController.php`)

```php
<?php

namespace App\Http\Controllers;

use App\Services\DatasheetPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DatasheetController extends Controller
{
    public function generate(Request $request, DatasheetPdfService $pdfService)
    {
        $validated = $request->validate([
            'project_name'           => 'required|string|max:255',
            'logo_url'               => 'nullable|string',
            'products'               => 'required|array|min:1',
            'products.*.code'        => 'nullable|string',
            'products.*.name'        => 'nullable|string',
            'products.*.description' => 'nullable|string',
            'products.*.image'       => 'nullable|string',
            'products.*.diagram'     => 'nullable|string',
            'products.*.specs'       => 'nullable',
        ]);

        $projectName = $validated['project_name'];
        $products    = $validated['products'];
        $logoUrl     = $validated['logo_url'] ?? null;

        $pdfBinary = $pdfService->generate($projectName, $products, $logoUrl);

        $safeName = Str::slug($projectName, '_') . '_datasheet.pdf';

        return response($pdfBinary, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$safeName}\"",
        ]);
    }
}
```

---

## 5. API Route (`routes/api.php`)

```php
use App\Http\Controllers\DatasheetController;

Route::post('/datasheets/generate', [DatasheetController::class, 'generate']);
```

---

## 6. Example API JSON Payload

```json
{
  "project_name": "Skyline Office Tower",
  "logo_url": "https://example.com/assets/logo.png",
  "products": [
    {
      "code": "AZ-DL-20W-3K",
      "name": "20W Commercial Downlight",
      "description": "High performance architectural downlight with deep reflector.",
      "image": "https://example.com/products/downlight.png",
      "diagram": "https://example.com/products/downlight-dims.png",
      "specs": {
        "Wattage": "20W",
        "Lumen Output": "2200 lm",
        "CCT": "3000K Warm White",
        "CRI": ">90",
        "Beam Angle": "60°",
        "IP Rating": "IP44"
      }
    }
  ]
}
```
