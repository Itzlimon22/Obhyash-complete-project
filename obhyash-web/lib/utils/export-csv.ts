/**
 * Production-grade CSV Export Utility
 * Handles UTF-8 BOM (\uFEFF) for crisp rendering of Bengali (বাংলা) fonts
 * and characters in Microsoft Excel, Google Sheets, Apple Numbers, etc.
 */

export interface CSVExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Escapes and formats a single cell value for CSV.
 */
function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let stringValue = String(value);

  // Preserve leading zeros for phone numbers (e.g., "01712345678") in Excel
  // by formatting as a text formula if it starts with 0 and looks like a phone number
  const isPhone = /^01[3-9]\d{8}$/.test(stringValue.trim());
  if (isPhone) {
    return `="${stringValue.trim()}"`;
  }

  // If the cell contains quotes, commas, newlines, or carriage returns, wrap in quotes and escape internal quotes
  if (
    stringValue.includes('"') ||
    stringValue.includes(',') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    stringValue = `"${stringValue.replace(/"/g, '""')}"`;
  } else {
    stringValue = `"${stringValue}"`;
  }

  return stringValue;
}

/**
 * Exports data to a CSV file and triggers a browser download.
 * Automatically injects the UTF-8 Byte Order Mark (\uFEFF) so Bengali fonts display perfectly in Excel.
 */
export function exportToCSV({ filename, headers, rows }: CSVExportOptions): boolean {
  try {
    if (!rows || rows.length === 0) {
      return false;
    }

    // 1. Process header row
    const headerLine = headers.map(escapeCSVCell).join(',');

    // 2. Process data rows
    const dataLines = rows.map((row) => row.map(escapeCSVCell).join(','));

    // 3. Combine with newlines
    const csvContent = [headerLine, ...dataLines].join('\r\n');

    // 4. Inject UTF-8 BOM (\uFEFF) to fix Excel Bengali font encoding
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    // 5. Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute('download', safeFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    return true;
  } catch (error) {
    console.error('CSV Export Error:', error);
    return false;
  }
}
