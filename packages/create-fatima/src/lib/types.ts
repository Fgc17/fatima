import type { select } from "@inquirer/prompts";

export type InquirerSelectChoice = Parameters<typeof select>[0]["choices"];

export type Language = "typescript" | "javascript";

export type Validator = "zod" | "custom";

export type Adapter = "local" | "infisical" | "vercel" | "custom";
