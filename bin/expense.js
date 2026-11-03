#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
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
import { toCsv } from "../src/csv.js";
import { importCsv } from "../src/import.js";

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
  node bin/expense.js export --format csv --out expenses.csv
  node bin/expense.js import --file bank.csv (columns: date,amount[,category,note]; missing category becomes Uncategorized)
  Add --no-color to disable terminal colors.
  node bin/expense.js help`);
}

function color(text, code, enabled) {
  return enabled ? `\u001b[${code}m${text}\u001b[0m` : text;
}

function shortId(id) {
  return String(id).slice(0, 8);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const useColor = process.stdout.isTTY && !options.noColor;

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
      color(
        `Added ${currency.format(expense.amount)} for ${expense.category} (ID: ${shortId(expense.id)}).`,
        "32",
        useColor,
      ),
    );
    return;
  }

  if (command === "list") {
    const expenses = listExpenses(await load(), options);
    console.table(
      expenses.map(({ id, date, category, note, amount }) => ({
        ID: shortId(id),
        Date: date,
        Category: color(category, "36", useColor),
        Note: note,
        Amount: currency.format(amount),
      })),
    );
    return;
  }

  if (command === "delete") {
    const expenses = deleteExpense(await load(), options.id);
    await save(expenses);
    console.log(color(`Deleted expense ${options.id}.`, "32", useColor));
    return;
  }

  if (command === "edit") {
    const { id, ...updates } = options;
    const expenses = editExpense(await load(), id, updates);
    await save(expenses);
    console.log(color(`Updated expense ${id}.`, "32", useColor));
    return;
  }

  if (command === "budget") {
    const settings = setBudget(await loadSettings(), options.set);
    await saveSettings(settings);
    console.log(
      color(
        `Monthly budget set to ${currency.format(settings.monthlyBudget)}.`,
        "32",
        useColor,
      ),
    );
    return;
  }

  if (command === "export") {
    if (options.format !== "csv") {
      throw new Error("Export format must be csv (use --format csv)");
    }
    if (!options.out) {
      throw new Error("Export requires an output path (use --out <file>)");
    }
    await writeFile(options.out, toCsv(await load()), "utf8");
    console.log(color(`Exported expenses to ${options.out}.`, "32", useColor));
    return;
  }

  if (command === "import") {
    if (!options.file) {
      throw new Error("Import requires an input path (use --file <file>)");
    }
    const result = await importCsv(await load(), options.file);
    await save(result.expenses);
    console.log(color(`Imported ${result.imported} expense(s).`, "32", useColor));
    if (result.skipped.length > 0) {
      console.warn(
        color(`Skipped ${result.skipped.length} invalid row(s):`, "33", useColor),
      );
      for (const { line, reason } of result.skipped) {
        console.warn(color(`  Line ${line}: ${reason}`, "33", useColor));
      }
    }
    return;
  }

  const month = options.month ?? currentMonth();
  const expenses = listExpenses(await load(), { month });
  const settings = await loadSettings();
  const summary = summarizeExpenses(expenses, settings.monthlyBudget);

  console.log(color(`Summary for ${month}`, "1", useColor));
  console.log(`Total spent: ${currency.format(summary.total)}`);
  if (summary.categories.length === 0) {
    console.log("No expenses for this period.");
  } else {
    console.log("\nSpending by category:");
    for (const { category, amount, bar } of summary.categories) {
      console.log(
        `${category.padEnd(16)} ${color(bar, "32", useColor)} ${currency.format(amount)}`,
      );
    }
  }
  if (summary.biggest) {
    console.log(
      `\nBiggest expense: ${currency.format(summary.biggest.amount)} — ${summary.biggest.category} (${summary.biggest.date}, ID: ${shortId(summary.biggest.id)})`,
    );
  }
  if (summary.budgetStatus === "exceeded") {
    console.log(
      `\n${color(`Budget exceeded (${currency.format(settings.monthlyBudget)}).`, "31", useColor)}`,
    );
  } else if (summary.budgetStatus === "warning") {
    console.log(
      `\n${color(`Budget warning: spending has reached 80% of ${currency.format(settings.monthlyBudget)}.`, "33", useColor)}`,
    );
  }
}

main().catch((error) => {
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";
  const message =
    error instanceof Error && error.code === "ENOENT"
      ? `File not found or inaccessible: ${error.path ?? "requested path"}`
      : errorMessage || "An unexpected error occurred";
  const useColor = process.stdout.isTTY && !process.argv.includes("--no-color");
  console.error(color(`Error: ${message}`, "31", useColor));
  if (process.env.DEBUG === "1" && error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exitCode = 1;
});
