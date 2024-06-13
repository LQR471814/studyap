# studyap.org

```bash
pnpm install
pnpm dev
pnpm db:push

pnpm tsx cmd/generator/dummy
# or if you want to generate using openai or gemini (whichever one you've configured)
pnpm dev:gen
```

make sure you set the required environment variables and follow the steps under "setting up mailgun".

then goto `http://localhost:5173` for the ui.

## detailed documentation

- [hosting guide](./docs/hosting.md)
- [how auth works](./docs/auth.md)

## environment variables

you should use a file called `.dev.vars` to keep your environment variables.

```ini
# .dev.vars

# note: openai and google are mutually exclusive, you cannot specify both api keys at the same time
OPENAI_API_KEY="..."
GOOGLE_API_KEY="..."

# telemetry, to get error logs and other debug info, signup for a free account at honeycomb.io, get an API key and put it here
HONEYCOMB_API_KEY="..."

# for sending verification code emails
MAILGUN_API_KEY="..."

DATABASE_URL="..."
DATABASE_AUTH_TOKEN="..."
```

> [!NOTE]
> in projects using vite only `VITE_` prefixed environment variables will be exposed by `import.meta.env`.

## scripts

- `dev` - run a dev environment
- `test` - run unit tests
- `db:generate` - generates database sql migrations
- `db:push` - pushes migrations to a database
- `tsx` - executes a typescript script, usually used to execute scripts under `cmd/...`

> [!NOTE]
> the packages under `cmd/generator/` can be executed directly to generate ap test questions and push them to the currently configured database.

## pkg information

> [!IMPORTANT]
> do not upgrade `@opentelemetry/api` from version `1.6.0` (until there is a fix for [this](https://github.com/evanderkoogh/otel-cf-workers/issues/115)).

