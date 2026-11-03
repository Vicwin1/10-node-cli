import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { addExpense } from "./expenses.js";
import { isCsvRecordComplete, parseCsvRecord } from "./csv.js";

const HEADER_ALIASES = {
  amount: ["amount", "debit"],
  category: ["category"],
  date: ["date", "transaction date", "trans date"],
  note: ["note", "description", "memo", "details", "narration"],
};

function resolveHeaders(record) {
  const headers = parseCsvRecord(record).map((header) =>
    header.replace(/^\uFEFF/, "").trim().toLowerCase(),
  );
  const mapping = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const index = headers.findIndex((header) => aliases.includes(header));
    if (index !== -1) {
      mapping[field] = index;
    }
  }

  for (const required of ["date", "amount"]) {
    if (mapping[required] === undefined) {
      throw new Error(
        `CSV header must include date and amount columns (missing ${required})`,
      );
    }
  }
  return { headers, mapping };
}

export async function importCsv(expenses, filePath) {
  const input = createReadStream(filePath, { encoding: "utf8" });
  const lines = createInterface({ input, crlfDelay: Infinity });
  const imported = [];
  const skipped = [];
  let header;
  let record = "";
  let physicalLine = 0;
  let recordStartLine = 0;

  try {
    for await (const line of lines) {
      physicalLine += 1;
      if (record.length === 0) {
        recordStartLine = physicalLine;
      } else {
        record += "\n";
      }
      record += line;

      if (!isCsvRecordComplete(record)) {
        continue;
      }
      const currentRecord = record;
      const lineNumber = recordStartLine;
      record = "";

      if (!currentRecord.trim()) {
        continue;
      }

      if (!header) {
        header = resolveHeaders(currentRecord);
        continue;
      }

      try {
        const values = parseCsvRecord(currentRecord);
        if (values.length !== header.headers.length) {
          throw new Error(
            `Expected ${header.headers.length} columns but found ${values.length}`,
          );
        }
        const inputRow = Object.fromEntries(
          Object.entries(header.mapping).map(([field, index]) => [
            field,
            values[index],
          ]),
        );
        imported.push(
          addExpense([], {
            ...inputRow,
            category: inputRow.category?.trim() || "Uncategorized",
            id: randomUUID(),
          })[0],
        );
      } catch (error) {
        skipped.push({ line: lineNumber, reason: error.message });
      }
    }
  } finally {
    lines.close();
  }

  if (!header) {
    throw new Error("CSV file is empty or has no header row");
  }
  if (record.length > 0) {
    skipped.push({
      line: recordStartLine,
      reason: "Unterminated quoted field at end of file",
    });
  }

  return {
    expenses: [...expenses, ...imported],
    imported: imported.length,
    skipped,
  };
}
