#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import {
  addExpense,
  deleteExpense,
  editExpense,
  listExpenses,
  setBudget,
} from "../src/expenses.js";
import { summarizeExpenses } from "../src/report.js";
import { parseArgs } from "../src/args.js";
import {
  load,
  loadSettings,
  save,
  saveSettings,
} from "../src/store.js";

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function showHelp() {
  console.log(`Expense Tracker

Usage:
  node bin/expense.js add --amount 2500 --category food --note "lunch" [--date YYYY-MM-DD]
  node bin/expense.js list [--category food] [--month YYYY-MM]
  node bin/expense.js edit --id <id> [--amount 3000] [--category food] [--note "dinner"] [--date YYYY-MM-DD]
  node bin/expense.js delete --id <id>
  node bin/expense.js summary [--month YYYY-MM] (defaults to the current month)
  node bin/expense.js budget --set 50000
  node bin/expense.js help`);
}

function shortId(id) {
  return String(id).slice(0, 8);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === "help") {
    showHelp();
    return;
  }

  if (command === "add") {
    const input = {
      ...options,
      id: randomUUID(),
      date: options.date ?? new Date().toISOString().slice(0, 10),
    };
    const expenses = addExpense(await load(), input);
    await save(expenses);
    const expense = expenses.at(-1);
    console.log(
      `Added ${currency.format(expense.amount)} for ${expense.category} (ID: ${shortId(expense.id)}).`,
    );
    return;
  }

  if (command === "list") {
    const expenses = listExpenses(await load(), options);
    console.table(
      expenses.map(({ id, date, category, note, amount }) => ({
        ID: shortId(id),
        Date: date,
        Category: category,
        Note: note,
        Amount: currency.format(amount),
      })),
    );
    return;
  }

  if (command === "delete") {
    const expenses = deleteExpense(await load(), options.id);
    await save(expenses);
    console.log(`Deleted expense ${options.id}.`);
    return;
  }

  if (command === "edit") {
    const { id, ...updates } = options;
    const expenses = editExpense(await load(), id, updates);
    await save(expenses);
    console.log(`Updated expense ${id}.`);
    return;
  }

  if (command === "budget") {
    const settings = setBudget(await loadSettings(), options.set);
    await saveSettings(settings);
    console.log(`Monthly budget set to ${currency.format(settings.monthlyBudget)}.`);
    return;
  }

  const month = options.month ?? currentMonth();
  const expenses = listExpenses(await load(), { month });
  const settings = await loadSettings();
  const summary = summarizeExpenses(expenses, settings.monthlyBudget);

  console.log(`Summary for ${month}`);
  console.log(`Total spent: ${currency.format(summary.total)}`);
  if (summary.categories.length === 0) {
    console.log("No expenses for this period.");
  } else {
    console.log("\nSpending by category:");
    for (const { category, amount, bar } of summary.categories) {
      console.log(`${category.padEnd(16)} ${bar} ${currency.format(amount)}`);
    }
  }
  if (summary.biggest) {
    console.log(
      `\nBiggest expense: ${currency.format(summary.biggest.amount)} — ${summary.biggest.category} (${summary.biggest.date}, ID: ${shortId(summary.biggest.id)})`,
    );
  }
  if (summary.budgetStatus === "exceeded") {
    console.log(`\nBudget exceeded (${currency.format(settings.monthlyBudget)}).`);
  } else if (summary.budgetStatus === "warning") {
    console.log(
      `\nBudget warning: spending has reached 80% of ${currency.format(settings.monthlyBudget)}.`,
    );
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
