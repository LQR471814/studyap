## hosting

to host studyap, you need a few third-party services.

### honeycomb

1. register for an account at [honeycomb.io](https://honeycomb.io)
2. create an API key and keep it somewhere for use in cloudflare workers

### turso

1. register for an account at [turso.tech](https://turso.tech)
2. install the turso cli, login with `turso auth login`
3. create a db using `turso db create <db name>`
4. get the db url using `turso db show --url <db name>`
5. get an auth token using `turso db tokens create <db name>`
6. store the db url and auth token somewhere for use in cloudflare workers

### mailgun

1. register for an account at [mailgun](https://www.mailgun.com/)
2. go to `Send > Domains > Add new domain`, enter your domain name
3. proceed with mailgun's instructions on adding your own domain
4. create an api key
5. store the api key somewhere for use in cloudflare workers

### cloudflare workers

1. register for an account at [cloudflare](https://www.cloudflare.com)
2. run `pnpm deploy:api`, this will open an authorization prompt in the browser
3. accept the authorization and wait for the command to finish
4. copy the worker api link outputted by the command (ex. `https://studyap.<some user>.workers.dev`)
5. go to [dash.cloudflare.com](https://dash.cloudflare.com) > workers & pages
6. click on the "studyap" worker > settings > variables
7. add the following variables to the worker

```ini
OPENAI_API_KEY="..."
# or
GOOGLE_API_KEY="..."

HONEYCOMB_API_KEY="..."

MAILGUN_API_KEY="..."
MAILGUN_DOMAIN="..."

# use turso db url/api key
DATABASE_URL="..."
DATABASE_AUTH_TOKEN="..."
```

### static site

1. register for an account at [netlify](https://www.netlify.com/)
2. add new site > connect to git provider
3. authorize github, then allow/select the studyap repository
4. set the site name, change "public directory" to `dist`
5. add the following environment variables

```ini
VITE_API_URL="<worker api link>"
```

