---
id: installation
title: Getting started
sidebar_label: Getting started
---
## Installing

```
npm i relational-schema
```

## Generating the schema

Relational-schema generates code from your database schema.

It does this by running queries against your database to work out the table schema as well as the relations between tables.

:::important

We never recommend running the code gen against your production database. Instead you should run it against a local database with the same schema.

:::

### Configuring code gen

Define a config file `introspect-config.json` in the root directory of your project.
This file is only used for code-gen, not for connecting during run-time.
Change the contents of the file to connect to your database.

The `outdir` option specifies where the Javascript schema files will be output.
This should be inside of your project source so that the files are transpiled as part of your build.

Supported output formats:

-   `json`, `es6`, `ts`, `cjs`

For the `client` option you can choose between `mysql` and `pg`.

You can optionally specify a `prettierConfig` which should be a path to a valid `prettierrc` file.
This will be used to format the output files rather than the default formatting.

```json
{
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "users",
    "schema": "public",
    "outdir": "./src/generated",
    "format": "json",
    "client": "pg"
}
```

Run:

```
relations introspect
```

The above commands will generate the schema for `users` database.
The resulting files are stored in `./src/generated`.
