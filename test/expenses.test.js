import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addExpense, listExpenses } from "../src/expenses.js";

const validInput = {
  id: "uuid-1",
  amount: "2500",
  category: " food ",
  note: " lunch ",
  date: "2026-11-03",
};

describe("addExpense", () => {
  it("returns a new list with normalized expense fields", () => {
    const original = [];
    const result = addExpense(original, validInput);

    assert.deepEqual(original, []);
    assert.deepEqual(result, [
      {
        id: "uuid-1",
        amount: 2500,
        category: "food",
        note: "lunch",
        date: "2026-11-03",
      },
    ]);
  });

  it("rejects zero, negative, and non-numeric amounts", () => {
    for (const amount of ["0", "-1", "not a number"]) {
      assert.throws(
        () => addExpense([], { ...validInput, amount }),
        /positive number/,
      );
    }
  });

  it("rejects a missing category or ID", () => {
    assert.throws(() => addExpense([], { ...validInput, category: "  " }), /Category/);
    assert.throws(() => addExpense([], { ...validInput, id: "" }), /ID/);
  });

  it("rejects impossible dates", () => {
    assert.throws(
      () => addExpense([], { ...validInput, date: "2026-02-30" }),
      /YYYY-MM-DD/,
    );
  });

  it("rejects a non-array expense list", () => {
    assert.throws(() => addExpense({}, validInput), /array/);
  });
});

describe("listExpenses", () => {
  const expenses = [
    { ...validInput, category: "Food", date: "2026-11-03" },
    { ...validInput, id: "uuid-2", category: "transport", date: "2026-11-04" },
    { ...validInput, id: "uuid-3", category: "food", date: "2026-10-04" },
  ];

  it("returns all expenses when no filters are given", () => {
    assert.equal(listExpenses(expenses).length, 3);
  });

  it("filters categories without case sensitivity", () => {
    assert.deepEqual(
      listExpenses(expenses, { category: " food " }).map((expense) => expense.id),
      ["uuid-1", "uuid-3"],
    );
  });

  it("filters by month", () => {
    assert.deepEqual(
      listExpenses(expenses, { month: "2026-11" }).map((expense) => expense.id),
      ["uuid-1", "uuid-2"],
    );
  });

  it("combines category and month filters", () => {
    assert.deepEqual(
      listExpenses(expenses, { category: "food", month: "2026-11" }).map(
        (expense) => expense.id,
      ),
      ["uuid-1"],
    );
  });

  it("rejects malformed months and non-array lists", () => {
    assert.throws(() => listExpenses(expenses, { month: "2026-13" }), /YYYY-MM/);
    assert.throws(() => listExpenses(null), /array/);
  });
});
