import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeExpenses } from "../src/report.js";

describe("summarizeExpenses", () => {
  const expenses = [
    { id: "one", amount: 20, category: "food" },
    { id: "two", amount: 30, category: "transport" },
    { id: "three", amount: 10, category: "food" },
  ];

  it("calculates total and category totals", () => {
    const summary = summarizeExpenses(expenses);

    assert.equal(summary.total, 60);
    assert.deepEqual(
      summary.categories.map(({ category, amount }) => ({ category, amount })),
      [
        { category: "food", amount: 30 },
        { category: "transport", amount: 30 },
      ],
    );
  });

  it("scales category bars against the largest category", () => {
    const summary = summarizeExpenses(expenses);

    assert.equal(summary.categories[0].bar.length, 20);
    assert.equal(summary.categories[1].bar.length, 20);
  });

  it("finds the biggest single expense", () => {
    assert.equal(summarizeExpenses(expenses).biggest.id, "two");
  });

  it("warns at 80 percent and reports an exceeded budget", () => {
    assert.equal(summarizeExpenses(expenses, 75).budgetStatus, "warning");
    assert.equal(summarizeExpenses(expenses, 60).budgetStatus, "exceeded");
    assert.equal(summarizeExpenses(expenses, 100).budgetStatus, null);
  });

  it("handles an empty list", () => {
    assert.deepEqual(summarizeExpenses([]), {
      total: 0,
      categories: [],
      biggest: null,
      budgetStatus: null,
    });
  });
});
