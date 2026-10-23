// lib/export.ts

export interface ExportHeader {
  key: string;
  label: string;
  format?: (value: any, row: any) => string | number;
}

/**
 * Safely resolves nested keys like 'batch.name' or 'school.name'
 */
function getNestedValue(obj: any, key: string): any {
  if (!obj) return "";
  if (key in obj) return obj[key];
  return key
    .split(".")
    .reduce((acc, part) => (acc !== null && acc !== undefined ? acc[part] : undefined), obj);
}

/**
 * Cleanly formats a cell value for CSV, handling strings, numbers, booleans, objects, and Excel phone numbers
 */
function formatCellValue(raw: any, row: any, header?: ExportHeader): string {
  let value = header?.format ? header.format(raw, row) : raw;

  if (value === null || value === undefined) {
    return "";
  }

  // Handle nested objects that weren't resolved (e.g., raw batch or school objects)
  if (typeof value === "object") {
    if (value instanceof Date) {
      value = value.toISOString().split("T")[0];
    } else if ("name" in value && typeof value.name === "string") {
      value = value.name;
    } else if ("label" in value && typeof value.label === "string") {
      value = value.label;
    } else if ("title" in value && typeof value.title === "string") {
      value = value.title;
    } else {
      value = "";
    }
  }

  if (typeof value === "boolean") {
    value = value ? "Active" : "Inactive";
  }

  let str = String(value);

  // Preserve leading zeros for phone numbers (e.g. 017XXXXXXXX) when opened in Excel
  // Adding \t forces Excel to treat it as string without stripping leading zero
  if (/^0\d{8,14}$/.test(str)) {
    str = `\t${str}`;
  }

  // Escape double quotes and wrap in quotes if necessary
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Exports tabular data to CSV with UTF-8 BOM encoding for proper Unicode / Excel compatibility.
 */
export function exportToCSV(
  data: any[],
  filename: string,
  headers?: ExportHeader[]
) {
  if (!data || data.length === 0) return;

  const headersToUse: ExportHeader[] =
    headers ||
    Object.keys(data[0]).map((key) => ({
      key,
      label:
        key.charAt(0).toUpperCase() +
        key.slice(1).replace(/([A-Z])/g, " $1").trim(),
    }));

  const headerRow = headersToUse
    .map((h) => {
      const label = h.label;
      return label.includes(",") || label.includes('"')
        ? `"${label.replace(/"/g, '""')}"`
        : label;
    })
    .join(",");

  const rows = data.map((row) =>
    headersToUse
      .map((h) => {
        const raw = getNestedValue(row, h.key);
        return formatCellValue(raw, row, h);
      })
      .join(",")
  );

  const csvContent = [headerRow, ...rows].join("\r\n");

  // Prepend \uFEFF (UTF-8 BOM) so Excel opens UTF-8 characters without garbling
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const cleanFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", cleanFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
