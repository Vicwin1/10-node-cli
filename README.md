# Node.js Expense Tracker

A dependency-free command-line expense tracker for Node.js 20. Expenses and
budget settings are saved in `data/expenses.json` and `data/settings.json`.

## Requirements and tests

Use Node.js 20 or newer. Run the test suite with:

```sh
npm test
```

The tests use Node's built-in `node:test` and `node:assert/strict`; no packages
need to be installed.

## Commands

Run commands from this project directory with `node bin/expense.js`. Use
`--no-color` to disable ANSI color output (colors are otherwise enabled only
when writing to a terminal). Errors are concise by default; set `DEBUG=1` to
print a stack trace.

### `add`

Add a new expense. Amount must be positive, category is required, and date
defaults to today. IDs are UUIDs; the CLI displays the first eight characters.

```sh
node bin/expense.js add --amount 2500 --category food --note "lunch"
node bin/expense.js add --amount 1200 --category transport --date 2026-11-03
```

### `list`

List expenses, optionally filtering by category and/or month.

```sh
node bin/expense.js list
node bin/expense.js list --category food
node bin/expense.js list --month 2026-11
node bin/expense.js list --category food --month 2026-11
```

### `edit`

Edit one or more expense fields using the full ID or its displayed eight
character prefix. If a prefix matches multiple expenses, the command asks for
an unambiguous ID by returning an error.

```sh
node bin/expense.js edit --id ab12cd34 --amount 3000
node bin/expense.js edit --id ab12cd34 --category groceries --note "weekly shop"
```

### `delete`

Delete an expense by its full ID or displayed eight-character prefix.

```sh
node bin/expense.js delete --id ab12cd34
```

### `summary`

Show the month's total, spending by category, largest expense, and any budget
warning. Defaults to the current month.

```sh
node bin/expense.js summary
node bin/expense.js summary --month 2026-11
```

### `budget`

Set the monthly spending budget. Summary warns at 80% and reports when spending
reaches or exceeds the budget.

```sh
node bin/expense.js budget --set 50000
```

### `export`

Export all expenses to CSV with columns `id,date,amount,category,note`.

```sh
node bin/expense.js export --format csv --out expenses.csv
```

### `import`

Import a CSV file. Its header must include `date` and `amount`; `category` and
`note` are optional. `description`, `memo`, `details`, and `narration` are
accepted as aliases for `note`, and missing categories become `Uncategorized`.
Invalid records are skipped and their line numbers and reasons are reported.

```sh
node bin/expense.js import --file bank.csv
node bin/expense.js import --file sample-bank.csv
```

The included [sample-bank.csv](./sample-bank.csv) can be used to try an import.
Input is read as a stream, so the complete CSV is not loaded into memory before
processing.

### `help`

Display the built-in command summary.

```sh
node bin/expense.js help
```

## Install the `expense` command with `npm link`

The package declares `bin/expense.js` as the executable named `expense` in
`package.json`. The script's `#!/usr/bin/env node` shebang tells the operating
system to run it with the `node` found on your `PATH`. `npm link` creates a
global symlink for that executable, allowing it to be run from any folder.

From this project directory, run:

```sh
npm link
expense add --amount 2500 --category food --note "lunch"
expense list
```

`npm link` installs a symlink rather than copying the project. If npm reports
a permissions error, use a user-owned npm global prefix or configure npm's
global directory for your account instead of using `sudo`. To remove the link,
run `npm unlink -g node-expense-tracker`.
