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

## Runtime Configuration Diagnostic

To verify the actual configuration values loaded by the running service, a diagnostic endpoint is available. This endpoint provides a sanitized snapshot of non-sensitive configuration values.

### Endpoint Details

- **URL**: `GET /config/diagnostic`
- **Authentication**: Required (Bearer token)
- **Authorization**: Admin or Operator role required
- **Rate Limiting**: Applied

### Role-Based Access Control

Access to the configuration diagnostic endpoint is restricted to users with `admin` or `operator` roles.

#### Role Source Architecture

Roles are resolved through a dedicated `RoleResolverService` that decouples role assignment from the authentication guard. This service maps user IDs to roles based on environment configuration:

- **Role Resolution Flow**:
  1. `AuthGuard` authenticates the user and extracts `userId` from the Bearer token
  2. `AuthGuard` calls `RoleResolverService.resolveRoles(userId)` to determine user roles
  3. `RoleGuard` validates the user has the required roles for the endpoint

- **Role Assignment Rules**:
  - All authenticated users receive the `User` role by default
  - Users in `ADMIN_USER_IDS` receive the `Admin` role
  - Users in `OPERATOR_USER_IDS` receive the `Operator` role
  - A user can have multiple roles simultaneously

#### Configuration

User roles are configured via environment variables:

- `ADMIN_USER_IDS`: JSON array of user IDs with admin privileges
- `OPERATOR_USER_IDS`: JSON array of user IDs with operator privileges

Example configuration:

```dotenv
ADMIN_USER_IDS=["user-id-1", "user-id-2"]
OPERATOR_USER_IDS=["user-id-3"]
```

#### Default Deny Strategy

When privileged roles (Admin/Operator) are required but not configured, **access is denied by default**:

- If both `ADMIN_USER_IDS` and `OPERATOR_USER_IDS` are empty arrays, all requests to privileged endpoints will be rejected with `AdminNotConfiguredError` (HTTP 403)
- This prevents accidental exposure of sensitive configuration in environments where admin access hasn't been properly set up
- This is a "fail closed" security posture: no one gets access until explicitly granted

### HTTP Status Codes and Error Responses

The endpoint returns the following error responses:

| Scenario                                  | Status Code | Error Code                      | Message                                                     |
| ----------------------------------------- | ----------- | ------------------------------- | ----------------------------------------------------------- |
| No `Authorization` header                 | 401         | `USER_IS_NOT_AUTHORIZED`        | "User is not authorized"                                    |
| Invalid authorization scheme (not Bearer) | 401         | `USER_IS_NOT_AUTHORIZED`        | "User is not authorized"                                    |
| No admin/operator users configured        | 403         | `ADMIN_NOT_CONFIGURED`          | "Administrator access is not configured for this instance"  |
| User has no assigned roles                | 403         | `USER_INSUFFICIENT_PERMISSIONS` | "User has no assigned roles"                                |
| User has `User` role only                 | 403         | `USER_INSUFFICIENT_PERMISSIONS` | "User requires Admin or Operator role(s) but has User"      |
| User has wrong role                       | 403         | `USER_INSUFFICIENT_PERMISSIONS` | "User requires Admin or Operator role(s) but has \<roles\>" |

### Response Fields (Explicit Whitelist)

The endpoint returns only the following explicitly whitelisted configuration values. No sensitive fields are included, even in masked form:

| Field                 | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `environment`         | Current environment name (development/test/production) |
| `port`                | Application port                                       |
| `appName`             | Application name                                       |
| `appVersion`          | Application version                                    |
| `redisEnabled`        | Redis enabled status                                   |
| `redisHost`           | Redis host                                             |
| `redisPort`           | Redis port                                             |
| `databaseLogLevels`   | Database log levels array                              |
| `sentryEnabled`       | Sentry enabled status                                  |
| `swaggerEnabled`      | Swagger enabled status                                 |
| `swaggerEndpoint`     | Swagger endpoint path                                  |
| `logLevel`            | Log level                                              |
| `logPretty`           | Pretty logging enabled                                 |
| `logExcludeEndpoints` | Endpoints excluded from logging                        |

### Security Considerations

Strict security measures are enforced:

- **Role-based access**: Only admin and operator users can access this endpoint
- **Explicit whitelist**: Only predefined non-sensitive fields are returned
- **No sensitive data**: Database credentials, Sentry DSN, API keys, and tokens are never included in the response
- **No masking fallback**: Sensitive fields are completely excluded, not just masked
- **Automatic filtering**: Response is filtered through a whitelist to prevent accidental exposure
- **Fail closed default**: Privileged endpoints are inaccessible until admin/operator users are explicitly configured
- **Decoupled role resolution**: `RoleResolverService` centralizes role assignment logic, making it easy to extend to other authentication schemes in the future

### Usage Example

```bash
curl -H "Authorization: Bearer <admin-or-operator-token>" http://localhost:3000/config/diagnostic
```

Response:

```json
{
  "environment": "development",
  "port": 3000,
  "appName": "backend",
  "appVersion": "1.0.0",
  "redisEnabled": true,
  "redisHost": "localhost",
  "redisPort": 6379,
  "databaseLogLevels": ["query", "error"],
  "sentryEnabled": true,
  "swaggerEnabled": true,
  "swaggerEndpoint": "docs",
  "logLevel": "info",
  "logPretty": true,
  "logExcludeEndpoints": ["/health"]
}
```

## Why This Approach Works Well

This configuration strategy provides several advantages:

- configuration becomes self-documented
- developers can run the project immediately after cloning
- secrets remain secure and outside the repository
- configuration is type-safe and validated
- configuration is organized into small, predictable modules
- runtime configuration can be verified via the diagnostic endpoint

As the project grows, this structure allows the configuration system to scale without becoming difficult to maintain.
