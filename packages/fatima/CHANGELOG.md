# fatima

## 0.0.28
### Patch Changes

- fix: patch prettier foramatting import issue

## 0.0.27
### Patch Changes

- fix: patch pnpm symlink eloop

## 0.0.26
### Patch Changes

- fix: patch wrong --strict option declaration

## 0.0.25
### Patch Changes (next)

From highest to lowest impact.

#### CLI

- feat: add opt-in strict mode
- feat: add env reload on typing r or R

#### Config

- feat: add support for env type augmentation through schema declaration

    The `validate` key is now deprecated in favor of `schema`, envs get validated through schema specifications. This allows for augmenting the generated client typing through the schema.

#### ESLint Plugin

- refactor: improve eslint rule customization

    Previously the `noProcessEnv` rule was automatically assigned when importing the plugin, now it must be manually declarated, along with file glob pattern.

#### Register (fatima/register)

- feat: add register import

    Now it is possible to import `fatima/register` in order to load envs synchronously, through local `.env` files. Exactly like `dotenv/config` works.

## 0.0.24
### Patch Changes (2025/03/31)

- fix broken public secrets typesafety

## 0.0.22

### Patch Changes (2025/03/24)

- expose env parse function
- add global cli options
- implement --process-env flag for skipping custom load functions
- implement --environment flag for overwriting the environment function result

## 0.0.21

### Patch Changes (2025/03/15)

- remove "fatima/tools" and "jiti" install requirements, now 0kb on production.

## 0.0.20

### Patch Changes (2025/02/22)

- add command aliases
- add jiti as automatically installed dependency

## 0.0.19

### Patch Changes (2025/02/22)

- remove vercel loader parse option
- add 'fatima install' command
- turn fatima into a real dev dependency

## 0.0.18

### Patch Changes

- reduce 40kb on bundlesize by implementing terser

## 0.0.17

### Patch Changes

- implement heaven, runtime env reloading solution

## 0.0.16

### Patch Changes

- disable removeNodeProtocol

## 0.0.15

### Patch Changes

- improve instrumentation compatibility

## 0.0.14

### Patch Changes

- improve logging and make instrumentation safer

## 0.0.13

### Patch Changes

- add complete environment reloading support

## 0.0.12

### Patch Changes

- add type abstraction and fix type errors

## 0.0.11

### Patch Changes

- remove inquirer dependency

## 0.0.10

### Patch Changes

- remove transform decorators plugin depemdency

## 0.0.9

### Patch Changes

- add full lite mode support and performance improvements.

## 0.0.8

### Patch Changes

- ignore .env files starting with .tmp

## 0.0.7

### Patch Changes

- improve publishing method

## 0.0.6

### Patch Changes

- implement underlying type api, a reload command and general fixes

## 0.0.5

### Patch Changes

- implement environment configuration

## 0.0.4

### Patch Changes

- make vercel load function more consistent

## 0.0.3

### Patch Changes

- improve warn for wrong environment
- improve warn when NODE_ENV is undefined

## 0.0.2

### Patch Changes

- fix undefined environments in initializers

## 0.0.1

### Patch Changes

- first fatima version
