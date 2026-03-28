const createEnv = (options) => {
  const isServer = options.isServer || (() => typeof window === "undefined");

  const isAccessForbidden = () => !isServer();

  const handleForbiddenAccess = (key) => {
    const error = [
      `Environment variable ${key} not allowed on the client.`,
      "Here are some possible fixes:",
      "\n 1. Add the public prefix to your variable if you want to expose it to the client.",
      "\n 2. Check if your public prefix is correct by assigning 'env.publicPrefix' to your fatima configuration.",
    ];

    throw new Error(error.join("\n"));
  };

  const fatimaEnv = new Proxy(process.env, {
    get(target, key) {
      if (
        typeof key !== "string" ||
        key === "__esModule" ||
        key === "$$typeof"
      ) {
        return undefined;
      }

      if (isAccessForbidden()) {
        handleForbiddenAccess(key);
      }

      return Reflect.get(target, key);
    },
  });

  return fatimaEnv;
};

const createPublicEnv = (publicVariables) => publicVariables;
