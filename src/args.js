const VALUE_OPTIONS = new Set([
  "amount",
  "category",
  "note",
  "date",
  "month",
  "id",
  "set",
  "format",
  "out",
  "file",
]);
const COMMAND_OPTIONS = {
  add: new Set(["amount", "category", "note", "date"]),
  list: new Set(["category", "month"]),
  delete: new Set(["id"]),
  edit: new Set(["id", "amount", "category", "note", "date"]),
  summary: new Set(["month"]),
  budget: new Set(["set"]),
  export: new Set(["format", "out"]),
  import: new Set(["file"]),
  help: new Set(),
};
const GLOBAL_FLAGS = new Set(["no-color"]);

export function parseArgs(argv) {
  const [command = "help", ...args] = argv;
  const options = {};

  if (!Object.hasOwn(COMMAND_OPTIONS, command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const equalsIndex = argument.indexOf("=");
    const rawName = argument.slice(2, equalsIndex === -1 ? undefined : equalsIndex);
    if (GLOBAL_FLAGS.has(rawName)) {
      if (equalsIndex !== -1) {
        throw new Error(`Flag --${rawName} does not take a value`);
      }
      if (Object.hasOwn(options, "noColor")) {
        throw new Error("Flag --no-color was provided more than once");
      }
      options.noColor = true;
      continue;
    }

    if (!VALUE_OPTIONS.has(rawName)) {
      throw new Error(`Unknown option: --${rawName}`);
    }
    if (!COMMAND_OPTIONS[command].has(rawName)) {
      throw new Error(`Option --${rawName} cannot be used with ${command}`);
    }

    const value =
      equalsIndex === -1 ? args[++index] : argument.slice(equalsIndex + 1);
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Option --${rawName} requires a value`);
    }
    if (Object.hasOwn(options, rawName)) {
      throw new Error(`Option --${rawName} was provided more than once`);
    }

    options[rawName] = value;
  }

  return { command, options };
}
