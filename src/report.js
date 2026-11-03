export function summarizeExpenses(expenses, budget) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = new Map();
  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + expense.amount,
    );
  }

  const largestCategoryTotal = Math.max(0, ...categoryTotals.values());
  const categories = [...categoryTotals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      bar: largestCategoryTotal
        ? "█".repeat(Math.max(1, Math.round((amount / largestCategoryTotal) * 20)))
        : "",
    }))
    .sort(
      (left, right) =>
        right.amount - left.amount || left.category.localeCompare(right.category),
    );
  const biggest = expenses.reduce(
    (largest, expense) =>
      largest === null || expense.amount > largest.amount ? expense : largest,
    null,
  );
  const budgetStatus =
    Number.isFinite(budget) && budget > 0
      ? total >= budget
        ? "exceeded"
        : total >= budget * 0.8
          ? "warning"
          : null
      : null;

  return { total, categories, biggest, budgetStatus };
}
