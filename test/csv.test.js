import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toCsv } from "../src/csv.js";

describe("toCsv", () => {
  it("writes the expected header and expense fields", () => {
    assert.equal(
      toCsv([
        {
          id: "uuid-1",
          date: "2026-11-03",
          amount: 2500,
          category: "food",
          note: "lunch",
        },
      ]),
      "id,date,amount,category,note\r\nuuid-1,2026-11-03,2500,food,lunch\r\n",
    );
  });

  it("quotes fields containing commas", () => {
    const csv = toCsv([{ category: "food, dining" }]);
    assert.ok(csv.includes('"food, dining"'));
  });

  it("doubles embedded quotes and quotes the field", () => {
    const csv = toCsv([{ note: 'said "hello"' }]);
    assert.ok(csv.includes('"said ""hello"""'));
  });

  it("quotes fields containing newlines", () => {
    const csv = toCsv([{ note: "line one\nline two" }]);
    assert.ok(csv.includes('"line one\nline two"'));
  });

  it("returns a header-only CSV for an empty list", () => {
    assert.equal(toCsv([]), "id,date,amount,category,note\r\n");
  });
});
