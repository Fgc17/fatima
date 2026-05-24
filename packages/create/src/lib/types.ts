import type { select } from "@inquirer/prompts";

export type InquirerSelectChoice = Parameters<typeof select>[0]["choices"];

export type Generator = "typescript" | "javascript" | "python";

export type Validator = "builtin" | "custom";

export type Adapter = "local" | "infisical" | "vercel" | "custom";
