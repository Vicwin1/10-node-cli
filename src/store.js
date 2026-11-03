import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dataFile = fileURLToPath(new URL("../data/expenses.json", import.meta.url));
const settingsFile = fileURLToPath(new URL("../data/settings.json", import.meta.url));

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

export async function loadSettings() {
  await mkdir(dirname(settingsFile), { recursive: true });

  try {
    const contents = await readFile(settingsFile, "utf8");
    const settings = JSON.parse(contents);
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new Error("Settings must be a JSON object");
    }
    if (
      Object.hasOwn(settings, "monthlyBudget") &&
      (!Number.isFinite(settings.monthlyBudget) || settings.monthlyBudget <= 0)
    ) {
      throw new Error("Monthly budget in settings must be a positive number");
    }
    return settings;
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(settingsFile, "{}\n", "utf8");
      return {};
    }
    throw error;
  }
}

export async function saveSettings(settings) {
  await mkdir(dirname(settingsFile), { recursive: true });
  await writeFile(settingsFile, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}
