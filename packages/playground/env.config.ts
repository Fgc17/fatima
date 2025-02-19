import { config } from "fatima";
import { adapters } from "fatima";
import { validators } from "fatima";
import { z, type ZodType } from "zod";
import type { EnvRecord } from "env";

type Environment = "development" | "staging" | "production";
type Constraint = Partial<EnvRecord<ZodType>>;
const constraint: Constraint = {
  NODE_ENV: z.enum(["development"]),
};

export default config<Environment>({
  load: {
    development: [adapters.local.load(".env")],
  },
  validate: validators.zod(z.object(constraint)),
  environment: (processEnv) => processEnv.NODE_ENV ?? "development",
});
