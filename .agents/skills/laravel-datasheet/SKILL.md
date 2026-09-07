---
name: laravel-datasheet
description: Guides and templates for generating Azoogi-style A4 datasheet PDFs in Laravel using Spatie Browsershot and Blade views.
---

# Laravel Datasheet Generator Skill

This skill provides the structure and code templates for integrating Azoogi datasheet PDF generation in Laravel.

## Reference File
Read the complete guide and code templates in [LARAVEL_INTEGRATION_GUIDE.md](file:///Users/prajunadhikary/Desktop/Projects/datasheet/LARAVEL_INTEGRATION_GUIDE.md).

## Key Components
1. **Engine**: `spatie/laravel-browsershot` (`npm i -D puppeteer`).
2. **Views**: `resources/views/datasheets/azoogi.blade.php`, `partials/page.blade.php`, `partials/specs-table.blade.php`.
3. **Service**: `App\Services\DatasheetPdfService` (renders HTML via `View::make()` and converts via `Browsershot::html()->format('A4')->pdf()`).
4. **Controller**: `App\Http\Controllers\DatasheetController` with API validation for `project_name` and `products` array.
