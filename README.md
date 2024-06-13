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

## setting up mailgun

mailgun is a service for sending emails, you can get a free account which can send 100 emails a day. but to actually send an email, you have to register your own domain.

after registering for an account, go to `Send > Domains > Add new domain`, enter your domain name and proceed with mailgun's instructions on adding your own domain (I'd assume it would be `studyap.org`).

after that, create an API key and store it in `MAILGUN_API_KEY`.

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

