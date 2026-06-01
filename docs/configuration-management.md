# Configuration Management

<p align="center">
  <img alt="Configuration Management" src="https://github.com/prod-forge/backend/blob/main/docs/assets/configuration-management.png" width="508px" height="523px">
</p>

Managing application configuration is often more complex than it appears.

Modern applications usually have many configuration parameters spread across multiple files and environments. The same
application may run in different environments such as:

- local
- test
- development
- production

A common problem at the start of many projects is keeping configuration documentation up to date. Developers often
struggle to understand how to correctly configure the application locally.

The approach used in this project solves this problem by combining versioned configuration, local overrides, and secure
secret management.

## Environment Configuration Strategy

The configuration system is built around two main files - `.env.common`, `.env`

`.env.common` - this is the primary configuration file used for local development.

Characteristics:

- contains all required environment variables
- fully configured for running the application locally
- does not contain sensitive secrets
- committed to the repository

Because this file is versioned, it acts as living documentation for all configuration variables required by the
application.

`.env` - this file is used for local overrides.

Sometimes developers need to change specific configuration values locally. For example:

- running a database on a different port
- using a local Redis instance
- modifying debug options

Instead of modifying `.env.common`, developers can override values in `.env`.

Example scenario:

A developer needs to override the database port locally.

```dotenv
DB_PORT=5332
```

Key properties:

- overrides variables defined in `.env.common`
- not committed to the repository
- optional for developers
- prevents merge conflicts between team members

Each developer may have their own `.env` file.

## Test Environment Overrides

For test environments, some parts of the system configuration may also need to be overridden. For example, throttle
limits may need to be increased because automated tests that repeatedly call the API could otherwise be blocked or
disable Sentry for test env.

Example:

```dotenv
THROTTLE_TTL=20000000
THROTTLE_LIMIT=10000
SENTRY_ENABLED=false
```

For such cases, we can use a dedicated `.env.test` file that overrides values from `.env.common` specifically for test
execution.

## Secret Management

Sensitive secrets such as:

- database passwords
- API keys
- JWT secrets
- third-party credentials

are never stored in environment files inside the repository.

Instead, secrets are injected directly into the container at runtime using Terraform.

This approach provides several important benefits:

- secrets are not visible in the repository
- secrets are not exposed during CI/CD
- secrets are stored securely in infrastructure systems (e.g. AWS Secrets Manager)
- only infrastructure-level access can retrieve them

In practice, secrets are passed to the container during deployment via Terraform configuration.

This significantly reduces the attack surface compared to storing secrets in environment files.

## NestJS Configuration Setup

In this project, NestJS loads configuration from both `.env` and `.env.common`.

`.env` takes precedence over `.env.common`.

Example configuration:

```typescript
ConfigModule.forRoot({
  envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')],
});
```

The same logic is applied in the database manager:

```shell
config({
  override: false,
  path: [
    join(process.cwd(), '.env'),
    join(process.cwd(), '.env.common'),
  ],
});
```

This ensures that:

1. `.env.common` provides default values
2. `.env` can override them locally if needed

## Structured Configuration Modules

At the application level, configuration is divided into semantic modules.

Instead of loading configuration as a large unstructured object, we split it into logical domains such as:

- app
- database
- redis

This makes configuration easier to understand, test, and maintain.

Example configuration module:

```typescript
class AppConfig {
  @IsString()
  APP_DESCRIPTION = packageJson.description || 'Description';

  @IsString()
  APP_HOST = '0.0.0.0';

  @IsString()
  APP_NAME = packageJson.name || 'App';

  @IsNumber()
  @Transform(({ value }) => Number(value))
  APP_PORT = 3000;

  @IsString()
  APP_VERSION = packageJson.version || '1.0.0';
}

export const appConfig = registerAs<AppConfig, ConfigFactory<AppConfigInterface>>(
  'appConfig',
  (): AppConfigInterface => {
    const config = validateConfig(AppConfig);

    return {
      appDescription: config.APP_DESCRIPTION,
      appHost: config.APP_HOST,
      appName: config.APP_NAME,
      appPort: config.APP_PORT,
      appVersion: config.APP_VERSION,
    };
  },
);
```

This approach provides several benefits:

- configuration validation
- typed configuration
- clear separation of concerns
- predictable configuration access

## Accessing Configuration

Configuration values are accessed through NestJS ConfigService.

Example:

```typescript
const configApp = configService.getOrThrow<ConfigType<typeof appConfig>>('appConfig');

await app.listen(configApp.appPort, configApp.appHost);
```

Using getOrThrow ensures that the application fails fast if a required configuration value is missing.

## Environment Variable Formats

The application uses structured parsing for array and boolean environment variables to provide clear error messages when configuration values are malformed.

### Boolean Values

Boolean environment variables are parsed by trimming whitespace and converting to lowercase before matching:

1. Value is trimmed: `value.trim()`
2. Value is lowercased: `.toLowerCase()`
3. Matched against: `true|1|yes` → `true`, `false|0|no` → `false`

| Raw value                                 | After trim + lowercase | Parsed as |
| ----------------------------------------- | ---------------------- | --------- |
| `true`, `TRUE`, `True`                    | `true`                 | `true`    |
| `"true"`, `"True"` (dotenv strips quotes) | `true`                 | `true`    |
| `1`                                       | `1`                    | `true`    |
| `yes`, `YES`, `Yes`                       | `yes`                  | `true`    |
| `  true  `                                | `true`                 | `true`    |
| `false`, `FALSE`, `False`                 | `false`                | `false`   |
| `0`                                       | `0`                    | `false`   |
| `no`, `NO`, `No`                          | `no`                   | `false`   |

Applicable variables: `API_ALLOWED_NON_BROWSER_ORIGINS`, `LOG_PRETTY`, `SWAGGER_ENABLED`, `DATABASE_SSL`, `DATABASE_FAIL_FAST`, `REDIS_ENABLED`, `SENTRY_ENABLED`

✅ Correct:

```dotenv
SWAGGER_ENABLED=true
REDIS_ENABLED=false
DATABASE_FAIL_FAST=1
SENTRY_ENABLED=no
LOG_PRETTY=TRUE
REDIS_ENABLED="false"
```

❌ Wrong — these are **not** recognized as booleans:

```dotenv
SWAGGER_ENABLED=enabled
REDIS_ENABLED=on
DATABASE_FAIL_FAST=yep
SENTRY_ENABLED=nope
LOG_PRETTY=123
```

Error output for an invalid boolean:

```
❌ Environment variable parse error for: SWAGGER_ENABLED
   Raw value: "enabled"
   Expected format: boolean (true or false)
   Details: Invalid boolean string: "enabled"
```

### Array Values

Array environment variables must be valid JSON arrays. Different array types have specific format requirements.

#### String Arrays

Used for: `API_ALLOWED_ORIGINS`, `LOG_EXCLUDE_ENDPOINTS`, `SENTRY_IGNORED_ERRORS`

✅ Correct:

```dotenv
API_ALLOWED_ORIGINS=["http://localhost:3001","http://example.com"]
LOG_EXCLUDE_ENDPOINTS=["/health","/metrics"]
SENTRY_IGNORED_ERRORS=["QueryFailedError","NotFoundError"]
LOG_EXCLUDE_ENDPOINTS=[]
```

❌ Wrong — common mistakes:

```dotenv
# Comma-separated without brackets and quotes
API_ALLOWED_ORIGINS=http://localhost:3001,http://example.com

# Brackets but unquoted strings (invalid JSON)
API_ALLOWED_ORIGINS=[http://localhost:3001]

# Quoted strings but no brackets (not a JSON array)
API_ALLOWED_ORIGINS="http://localhost:3001","http://example.com"

# Single-quoted strings (JSON requires double quotes)
LOG_EXCLUDE_ENDPOINTS=['/health','/metrics']
```

Error output for an invalid JSON array:

```
❌ Environment variable parse error for: API_ALLOWED_ORIGINS
   Raw value: "[http://localhost:3001]"
   Expected format: JSON array (e.g., ["item1", "item2"])
   Details: Unexpected token 'h' at position 1
```

Error output for a value that parses as JSON but is not an array:

```
❌ Environment variable parse error for: API_ALLOWED_ORIGINS
   Raw value: ""http://localhost:3001""
   Expected format: JSON array (e.g., ["item1", "item2"])
   Details: Parsed value is not an array, got string
```

#### Typed Arrays

Used for: `DATABASE_LOG_LEVELS` (values must be one of: `info`, `query`, `warn`, `error`)

✅ Correct:

```dotenv
DATABASE_LOG_LEVELS=["query","error","info","warn"]
DATABASE_LOG_LEVELS=["query"]
DATABASE_LOG_LEVELS=[]
```

❌ Wrong — common mistakes:

```dotenv
# Comma-separated without brackets and quotes
DATABASE_LOG_LEVELS=query,error

# Valid JSON array but contains invalid LogLevel value
DATABASE_LOG_LEVELS=["query","debug"]
```

Error output for an invalid item type:

```
❌ Environment variable parse error for: DATABASE_LOG_LEVELS
   Raw value: "[\"query\",\"debug\"]"
   Expected format: JSON array of LogLevel (e.g., ["query", "error", "info", "warn"])
   Details: Item at index 1 is not a LogLevel, got string
```

### Error Reporting

When a configuration error occurs, the application will display a clear error message during startup. Each error includes:

1. **Environment variable name** — which key has the problem
2. **Raw value** — the exact string the application received
3. **Expected format** — what the value should look like, with an example
4. **Details** — the specific reason the value was rejected

Errors are scoped per configuration module — if `API_ALLOWED_ORIGINS` fails, it will not pollute the validation of `DATABASE_LOG_LEVELS` or any other configuration module.

This helps developers quickly identify and fix configuration issues without having to debug cryptic JSON parse errors.

## Why This Approach Works Well

This configuration strategy provides several advantages:

- configuration becomes self-documented
- developers can run the project immediately after cloning
- secrets remain secure and outside the repository
- configuration is type-safe and validated
- configuration is organized into small, predictable modules
- clear error messages for malformed environment variables

As the project grows, this structure allows the configuration system to scale without becoming difficult to maintain.
