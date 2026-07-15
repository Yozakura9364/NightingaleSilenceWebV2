import { readFile } from "node:fs/promises";

export function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) {
    throw new Error("CSV contains an unterminated quoted field");
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

export async function readCsvRows(filePath) {
  return parseCsv(await readFile(filePath, "utf8"));
}

export async function readObjectCsv(filePath) {
  const rows = await readCsvRows(filePath);
  if (rows.length === 0) return [];
  const headers = rows[0];

  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, rowIndex) => {
    const record = { __rowNumber: rowIndex + 2 };
    headers.forEach((header, columnIndex) => {
      if (header && !(header in record)) record[header] = row[columnIndex] ?? "";
    });
    return record;
  });
}

export async function readSaintCoinachCsv(filePath) {
  const rows = await readCsvRows(filePath);
  if (rows.length < 3) throw new Error(`Invalid SaintCoinach CSV: ${filePath}`);

  const headers = rows[1];
  return rows.slice(3).filter((row) => row.some(Boolean)).map((row, rowIndex) => {
    const record = { __rowNumber: rowIndex + 4 };
    headers.forEach((header, columnIndex) => {
      if (header && !(header in record)) record[header] = row[columnIndex] ?? "";
    });
    return record;
  });
}
