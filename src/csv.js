const CSV_COLUMNS = ["id", "date", "amount", "category", "note"];

function escapeCsvField(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(expenses) {
  const rows = [
    CSV_COLUMNS,
    ...expenses.map((expense) => CSV_COLUMNS.map((column) => expense[column])),
  ];
  return `${rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n")}\r\n`;
}

export function parseCsvRecord(record) {
  const fields = [];
  let field = "";
  let inQuotes = false;
  let closedQuote = false;

  for (let index = 0; index < record.length; index += 1) {
    const character = record[index];
    if (inQuotes) {
      if (character === '"') {
        if (record[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (closedQuote) {
      if (character === ",") {
        fields.push(field);
        field = "";
        closedQuote = false;
      } else if (character !== "\r") {
        throw new Error("Unexpected character after a quoted field");
      }
      continue;
    }

    if (character === ",") {
      fields.push(field);
      field = "";
    } else if (character === '"') {
      if (field.length !== 0) {
        throw new Error("Quote inside an unquoted field");
      }
      inQuotes = true;
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("Unterminated quoted field");
  }
  fields.push(field);
  return fields;
}

export function isCsvRecordComplete(record) {
  let inQuotes = false;
  for (let index = 0; index < record.length; index += 1) {
    if (record[index] !== '"') {
      continue;
    }
    if (inQuotes && record[index + 1] === '"') {
      index += 1;
    } else {
      inQuotes = !inQuotes;
    }
  }
  return !inQuotes;
}
