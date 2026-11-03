#!/usr/bin/env node

import { addExpense, listExpenses } from "../src/expenses.js";
import { parseArgs } from "../src/args.js";
import { load, save } from "../src/store.js";

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function showHelp() {
  console.log(`Expense Tracker

Usage:
  node bin/expense.js add --amount 2500 --category food --note "lunch" [--date YYYY-MM-DD]
  node bin/expense.js list [--category food] [--month YYYY-MM]
  node bin/expense.js help`);
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
      date: options.date ?? new Date().toISOString().slice(0, 10),
    };
    const expenses = addExpense(await load(), input);
    await save(expenses);
    const expense = expenses.at(-1);
    console.log(`Added ${currency.format(expense.amount)} for ${expense.category}.`);
    return;
  }

  const expenses = listExpenses(await load(), options);
  console.table(
    expenses.map(({ id, date, category, note, amount }) => ({
      ID: id,
      Date: date,
      Category: category,
      Note: note,
      Amount: currency.format(amount),
    })),
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
