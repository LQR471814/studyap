# studyap.org

```bash
pnpm install

# run sqld
docker compose up -d

pnpm dev:ui
pnpm dev:api
```

## dotenv

you can use a `.env` to keep your environment variables for use in scripts.

```c
OPENAI_API_KEY="..."
DATABASE_URL="..."
DATABASE_AUTH_TOKEN="..."
```

## scripts

- `test` - run unit tests
- `db:generate` - generates database sql migrations
- `db:push` - pushes migrations to a database
- `script:generate` - generates AP tests (ex. `pnpm script:generate -count 2`)
- `script:list-tests` - view generated AP tests (ex. `pnpm script:list-tests`)
- `script:view-tests` - view specific generated AP tests in detail (ex. `pnpm script:view-tests <test id> <test id 2> ...`)

## ap test generation

1. run `pnpm db:push` to create/migrate a database.
1. run `pnpm script:generate -count 1` to generate 1 ap test. (this may take a while)
1. run `pnpm script:list-tests` to find the id of the test you generated. (it should be 1)
1. run `pnpm script:view-tests <test id>` to view the test you generated.

