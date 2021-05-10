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
Change the contents of the file to connect to your database.

For the `client` option you can choose between `mysql` and `pg`.

```json
{
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "users",
    "schema": "public",
    "client": "pg",
    "outdir": "./src/generated",
    "format": "json"
}
```

#### Options

-   `outdir` - where the Javascript schema files will be output.

-   `format` - `json`, `es6`, `ts`, `cjs` - the file output format

-   `prettierConfig` - specifies a path to a valid `prettierrc` file.
    This will be used to format the output files rather than the default formatting.

-   `transitiveRelations` - whether to include transitive (many-to-many) relations in the output. This can increase the file size by an order of magnitude so it is optional.

Run:

```
relations introspect
```

The above commands will generate the schema for `users` database.
The resulting files are stored in `./src/generated`.
