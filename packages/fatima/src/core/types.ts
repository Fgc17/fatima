import { Promisable } from "./utils/types";

export type UnsafeEnvironmentVariables = Record<string, string>;

export type FatimaEnvironment = string;

export type FatimaContext = {
  configPath: string;
};

export type FatimaLoadFunction = (
  processEnv: UnsafeEnvironmentVariables
) => Promisable<UnsafeEnvironmentVariables | null | undefined>;

export type FatimaLoaderChain = FatimaLoadFunction[] | FatimaLoadFunction;

export type FatimaLoadObject<Environments extends FatimaEnvironment> = {
  [env in Environments]?: FatimaLoaderChain;
};

export type FatimaValidator = (
  env: UnsafeEnvironmentVariables,
  context: FatimaContext
) => Promisable<{
  isValid: boolean;
  errors?: Array<{
    key: string;
    message: string;
  }>;
}>;

export type FatimaEnvironmentFunction = (
  processEnv: UnsafeEnvironmentVariables
) => string;

export interface FatimaClientOptions {
  /**
   * Prefix for the client
   */
  publicPrefix?: string;
  /**
   * Function to verify server environment
   */
  isServer?: () => boolean;
}

export interface FatimaHookOptions {
  port: number;
}
