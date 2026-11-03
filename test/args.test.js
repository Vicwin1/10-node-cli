import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArgs } from "../src/args.js";

describe("parseArgs", () => {
  it("uses help when no command is provided", () => {
    assert.deepEqual(parseArgs([]), { command: "help", options: {} });
  });

  it("parses options with separate values", () => {
    assert.deepEqual(
      parseArgs(["add", "--amount", "2500", "--note", "lunch"]),
      { command: "add", options: { amount: "2500", note: "lunch" } },
    );
  });

  it("parses equals values and the global no-color flag", () => {
    assert.deepEqual(
      parseArgs(["export", "--format=csv", "--out=expenses.csv", "--no-color"]),
      {
        command: "export",
        options: { format: "csv", out: "expenses.csv", noColor: true },
      },
    );
  });

  it("rejects unknown commands and options", () => {
    assert.throws(() => parseArgs(["remove"]), /Unknown command/);
    assert.throws(() => parseArgs(["list", "--unknown", "value"]), /Unknown option/);
  });

  it("rejects missing values and options used with the wrong command", () => {
    assert.throws(() => parseArgs(["add", "--amount"]), /requires a value/);
    assert.throws(() => parseArgs(["add", "--month", "2026-11"]), /cannot be used/);
  });
});
