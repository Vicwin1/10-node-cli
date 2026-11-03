function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function addExpense(list, input) {
  if (!Array.isArray(list)) {
    throw new TypeError("Expense list must be an array");
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const category = String(input.category ?? "").trim();
  if (!category) {
    throw new Error("Category is required");
  }

  const date = input.date;
  if (!isValidDate(date)) {
    throw new Error("Date must be a valid date in YYYY-MM-DD format");
  }

  const nextId = list.reduce(
    (maximum, expense) => Math.max(maximum, Number(expense.id) || 0),
    0,
  ) + 1;
  const expense = {
    id: nextId,
    amount,
    category,
    note: String(input.note ?? "").trim(),
    date,
  };

  return [...list, expense];
}

export function listExpenses(list, filters = {}) {
  if (!Array.isArray(list)) {
    throw new TypeError("Expense list must be an array");
  }

  if (
    filters.month !== undefined &&
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month)
  ) {
    throw new Error("Month must be in YYYY-MM format");
  }

  return list.filter((expense) => {
    const matchesCategory =
      filters.category === undefined ||
      expense.category.toLowerCase() === filters.category.trim().toLowerCase();
    const matchesMonth =
      filters.month === undefined || expense.date.startsWith(filters.month);
    return matchesCategory && matchesMonth;
  });
}
