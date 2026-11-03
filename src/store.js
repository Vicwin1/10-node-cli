import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dataFile = fileURLToPath(new URL("../data/expenses.json", import.meta.url));

export async function load() {
  await mkdir(dirname(dataFile), { recursive: true });

  try {
    const contents = await readFile(dataFile, "utf8");
    const expenses = JSON.parse(contents);
    if (!Array.isArray(expenses)) {
      throw new Error("Expense data must be a JSON array");
    }
    return expenses;
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(dataFile, "[]\n", "utf8");
      return [];
    }
    throw error;
  }
}

export async function save(expenses) {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(expenses, null, 2)}\n`, "utf8");
}
