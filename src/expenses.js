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

  const id = String(input.id ?? "");
  if (!id) {
    throw new Error("Expense ID is required");
  }
  const expense = {
    id,
    amount,
    category,
    note: String(input.note ?? "").trim(),
    date,
  };

  return [...list, expense];
}

function findExpenseIndex(list, id) {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Expense ID is required");
  }

  const matches = list
    .map((expense, index) => ({ expense, index }))
    .filter(({ expense }) => String(expense.id).startsWith(id.trim()));

  if (matches.length === 0) {
    throw new Error(`No expense found for ID: ${id}`);
  }
  if (matches.length > 1) {
    throw new Error(`ID prefix is ambiguous: ${id}`);
  }
  return matches[0].index;
}

export function deleteExpense(list, id) {
  if (!Array.isArray(list)) {
    throw new TypeError("Expense list must be an array");
  }
  const index = findExpenseIndex(list, id);
  return list.filter((_, itemIndex) => itemIndex !== index);
}

export function editExpense(list, id, updates) {
  if (!Array.isArray(list)) {
    throw new TypeError("Expense list must be an array");
  }
  const allowedFields = new Set(["amount", "category", "note", "date"]);
  const updateKeys = Object.keys(updates);
  if (updateKeys.length === 0) {
    throw new Error("Provide at least one field to update");
  }
  for (const key of updateKeys) {
    if (!allowedFields.has(key)) {
      throw new Error(`Cannot update field: ${key}`);
    }
  }

  const index = findExpenseIndex(list, id);
  const existing = list[index];
  const merged = { ...existing, ...updates, id: existing.id };
  const validated = addExpense([], {
    ...merged,
    id: existing.id,
  })[0];
  return list.map((expense, itemIndex) => (itemIndex === index ? validated : expense));
}

export function setBudget(settings, value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Budget must be a positive number");
  }
  return { ...settings, monthlyBudget: amount };
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
