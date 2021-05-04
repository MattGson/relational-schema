---
id: introduction
title: Intro
hide_title: true
sidebar_label: Introduction
---

[![npm](https://img.shields.io/npm/v/relational-schema.svg?style=for-the-badge)](https://www.npmjs.com/package/relational-schema)
[![GitHub tag](https://img.shields.io/github/tag/MattGson/relational-schema.svg?style=for-the-badge)](https://github.com/MattGson/relational-schema)
[![Github last commit][last-commit]][last-commit-link]
[![Pull Requests Welcome][prs-badge]][prs-link]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=for-the-badge)](http://commitizen.github.io/cz-cli/)

[last-commit]: https://img.shields.io/github/stars/MattGson/relational-schema.svg?style=for-the-badge&logo=github&logoColor=ffffff
[last-commit-link]: https://github.com/MattGson/relational-schema/commits
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge
[prs-link]: https://github.com/MattGson/relational-schema

> **Easily work with relational databases in Javascript and Typescript**

[Relational-schema](https://mattgson.github.io/relational-schema/) is a utility package to generate a semantic,
complete schema of a relational database (PostgreSQL, MySQL) in Javascript, JSON and other formats.

Relational-schema is built on top of trusted open-source projects:

-   [Knex](https://github.com/knex/knex)

Works with MySQL and PostgreSQL. SQLite coming soon.

Full docs [here](https://mattgson.github.io/relational-schema/)

### Why Relational-schema?

One of the key benefits of working with relational databases is the strict schema.
Often in our applications we fail to take advantage of this, instead we rely on handwritten simplifications
such as ORM models.

Relational-schema gives TS/JS developers a complete database schema including some nice additions (see below for specs).
The schema can be output in `json`, `es6`, `typescript` and `commonJS` to suit multiple use-cases.

This schema can be used for building better, more automated tooling for working with relational databases in JS.

Projects using Relational-schema

-   [Gybson](https://mattgson.github.io/Gybson) - an auto generated, typesafe, flexible query client for working with relational databases in typescript.

---

### Usage

```
npm install relational-schema
```

Create a config file `introspect-config.json`

```json
{
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "secure",
    "database": "mydb",
    "outdir": "src/schemas",
    "format": "json"
}
```

```
relational-schema introspect
```

The schema will be generated in `outdir` in the chosen format.

---

### Key features:

#### Full table definitions including:

-   columns (names, types, default values, nullability...)
-   keys and constraints
-   unique-ness
-   Typescript type mappings
-   table relations (including direction)
-   human readable relation alias'
-   soft-delete idenfication
-   enums

---

### Example output:

```json
{
    "database": "tests",
    "schema": "tests",
    "generatedAt": "2021-04-21T08:41:31.747Z",
    "tables": {
        "teams": {
            "primaryKey": {
                "constraintName": "teams_pkey",
                "constraintType": "PRIMARY KEY",
                "columnNames": ["team_id"]
            },
            "keys": [{ "constraintName": "teams_pkey", "constraintType": "PRIMARY KEY", "columnNames": ["team_id"] }],
            "uniqueKeyCombinations": [["team_id"]],
            "relations": [
                {
                    "toTable": "team_members",
                    "alias": "team_members",
                    "joins": [{ "fromColumn": "team_id", "toColumn": "team_id" }],
                    "type": "hasMany"
                }
            ],
            "columns": {
                "team_id": {
                    "dbType": "int4",
                    "columnDefault": "nextval('teams_team_id_seq'::regclass)",
                    "nullable": false,
                    "columnName": "team_id",
                    "tsType": "number"
                },
                "name": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "name",
                    "tsType": "string"
                },
                "deleted": {
                    "dbType": "bool",
                    "columnDefault": "false",
                    "nullable": true,
                    "columnName": "deleted",
                    "tsType": "boolean"
                }
            },
            "softDelete": {
                "dbType": "bool",
                "columnDefault": "false",
                "nullable": true,
                "columnName": "deleted",
                "tsType": "boolean"
            },
            "enums": {
                "teams_subscription_level": {
                    "enumName": "teams_subscription_level",
                    "values": ["BRONZE", "GOLD", "SILVER"],
                    "columnName": ""
                },
                "teams_permissions": { "enumName": "teams_permissions", "values": ["ADMIN", "USER"], "columnName": "" }
            }
        },
        "team_members": {
            "primaryKey": {
                "constraintName": "team_members_pkey",
                "constraintType": "PRIMARY KEY",
                "columnNames": ["team_id", "user_id"]
            },
            "keys": [
                {
                    "constraintName": "team_members_member_post_id_foreign",
                    "constraintType": "FOREIGN KEY",
                    "columnNames": ["member_post_id"]
                },
                {
                    "constraintName": "team_members_pkey",
                    "constraintType": "PRIMARY KEY",
                    "columnNames": ["team_id", "user_id"]
                },
                {
                    "constraintName": "team_members_team_id_foreign",
                    "constraintType": "FOREIGN KEY",
                    "columnNames": ["team_id"]
                },
                {
                    "constraintName": "team_members_user_id_foreign",
                    "constraintType": "FOREIGN KEY",
                    "columnNames": ["user_id"]
                }
            ],
            "uniqueKeyCombinations": [["team_id", "user_id"]],
            "relations": [
                {
                    "toTable": "posts",
                    "alias": "member_post",
                    "joins": [{ "fromColumn": "member_post_id", "toColumn": "post_id" }],
                    "type": "belongsTo"
                },
                {
                    "toTable": "teams",
                    "alias": "team",
                    "joins": [{ "fromColumn": "team_id", "toColumn": "team_id" }],
                    "type": "belongsTo"
                },
                {
                    "toTable": "users",
                    "alias": "user",
                    "joins": [{ "fromColumn": "user_id", "toColumn": "user_id" }],
                    "type": "belongsTo"
                },
                {
                    "toTable": "team_members_positions",
                    "alias": "team_members_position",
                    "joins": [
                        { "fromColumn": "team_id", "toColumn": "team_id" },
                        { "fromColumn": "user_id", "toColumn": "user_id" }
                    ],
                    "type": "hasOne"
                }
            ],
            "columns": {
                "team_id": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "team_id",
                    "tsType": "number"
                },
                "user_id": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "user_id",
                    "tsType": "number"
                },
                "member_post_id": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "member_post_id",
                    "tsType": "number"
                },
                "deleted": {
                    "dbType": "bool",
                    "columnDefault": "false",
                    "nullable": true,
                    "columnName": "deleted",
                    "tsType": "boolean"
                }
            },
            "softDelete": {
                "dbType": "bool",
                "columnDefault": "false",
                "nullable": true,
                "columnName": "deleted",
                "tsType": "boolean"
            },
            "enums": {
                "team_members_subscription_level": {
                    "enumName": "team_members_subscription_level",
                    "values": ["BRONZE", "GOLD", "SILVER"],
                    "columnName": ""
                },
                "team_members_permissions": {
                    "enumName": "team_members_permissions",
                    "values": ["ADMIN", "USER"],
                    "columnName": ""
                }
            }
        },
        "team_members_positions": {
            "primaryKey": {
                "constraintName": "team_members_positions_pkey",
                "constraintType": "PRIMARY KEY",
                "columnNames": ["team_id", "user_id"]
            },
            "keys": [
                {
                    "constraintName": "team_members_positions_position_manager_unique",
                    "constraintType": "UNIQUE",
                    "columnNames": ["manager", "position"]
                },
                {
                    "constraintName": "team_members_positions_pkey",
                    "constraintType": "PRIMARY KEY",
                    "columnNames": ["team_id", "user_id"]
                },
                {
                    "constraintName": "team_members_positions_team_id_user_id_foreign",
                    "constraintType": "FOREIGN KEY",
                    "columnNames": ["team_id", "user_id"]
                }
            ],
            "uniqueKeyCombinations": [
                ["manager", "position"],
                ["team_id", "user_id"]
            ],
            "relations": [
                {
                    "toTable": "team_members",
                    "alias": "team_member",
                    "joins": [
                        { "fromColumn": "team_id", "toColumn": "team_id" },
                        { "fromColumn": "user_id", "toColumn": "user_id" }
                    ],
                    "type": "hasOne"
                }
            ],
            "columns": {
                "team_id": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "team_id",
                    "tsType": "number"
                },
                "user_id": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "user_id",
                    "tsType": "number"
                },
                "position": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "position",
                    "tsType": "string"
                },
                "manager": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "manager",
                    "tsType": "string"
                },
                "verified": {
                    "dbType": "bool",
                    "columnDefault": "false",
                    "nullable": true,
                    "columnName": "verified",
                    "tsType": "boolean"
                }
            },
            "softDelete": null,
            "enums": {
                "team_members_positions_subscription_level": {
                    "enumName": "team_members_positions_subscription_level",
                    "values": ["BRONZE", "GOLD", "SILVER"],
                    "columnName": ""
                },
                "team_members_positions_permissions": {
                    "enumName": "team_members_positions_permissions",
                    "values": ["ADMIN", "USER"],
                    "columnName": ""
                }
            }
        },
        "users": {
            "primaryKey": {
                "constraintName": "users_pkey",
                "constraintType": "PRIMARY KEY",
                "columnNames": ["user_id"]
            },
            "keys": [
                {
                    "constraintName": "users_best_friend_id_foreign",
                    "constraintType": "FOREIGN KEY",
                    "columnNames": ["best_friend_id"]
                },
                { "constraintName": "users_email_unique", "constraintType": "UNIQUE", "columnNames": ["email"] },
                { "constraintName": "users_token_unique", "constraintType": "UNIQUE", "columnNames": ["token"] },
                { "constraintName": "users_pkey", "constraintType": "PRIMARY KEY", "columnNames": ["user_id"] }
            ],
            "uniqueKeyCombinations": [["email"], ["token"], ["user_id"]],
            "relations": [
                {
                    "toTable": "users",
                    "alias": "best_friend",
                    "joins": [{ "fromColumn": "best_friend_id", "toColumn": "user_id" }],
                    "type": "belongsTo"
                },
                {
                    "toTable": "posts",
                    "alias": "author_posts",
                    "joins": [{ "fromColumn": "user_id", "toColumn": "author_id" }],
                    "type": "hasMany"
                },
                {
                    "toTable": "posts",
                    "alias": "co_author_posts",
                    "joins": [{ "fromColumn": "user_id", "toColumn": "co_author" }],
                    "type": "hasMany"
                },
                {
                    "toTable": "team_members",
                    "alias": "team_members",
                    "joins": [{ "fromColumn": "user_id", "toColumn": "user_id" }],
                    "type": "hasMany"
                },
                {
                    "toTable": "users",
                    "alias": "users",
                    "joins": [{ "fromColumn": "user_id", "toColumn": "best_friend_id" }],
                    "type": "hasMany"
                }
            ],
            "columns": {
                "user_id": {
                    "dbType": "int4",
                    "columnDefault": "nextval('users_user_id_seq'::regclass)",
                    "nullable": false,
                    "columnName": "user_id",
                    "tsType": "number"
                },
                "best_friend_id": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "best_friend_id",
                    "tsType": "number"
                },
                "email": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "email",
                    "tsType": "string"
                },
                "first_name": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "first_name",
                    "tsType": "string"
                },
                "last_name": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "last_name",
                    "tsType": "string"
                },
                "password": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "password",
                    "tsType": "string"
                },
                "token": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "token",
                    "tsType": "string"
                },
                "permissions": {
                    "dbType": "permissions",
                    "columnDefault": "'USER'::permissions",
                    "nullable": true,
                    "columnName": "permissions",
                    "tsType": "users_permissions"
                },
                "subscription_level": {
                    "dbType": "subscription_level",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "subscription_level",
                    "tsType": "users_subscription_level"
                },
                "deleted_at": {
                    "dbType": "timestamptz",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "deleted_at",
                    "tsType": "Date"
                }
            },
            "softDelete": {
                "dbType": "timestamptz",
                "columnDefault": null,
                "nullable": true,
                "columnName": "deleted_at",
                "tsType": "Date"
            },
            "enums": {
                "users_subscription_level": {
                    "enumName": "users_subscription_level",
                    "values": ["BRONZE", "GOLD", "SILVER"],
                    "columnName": ""
                },
                "users_permissions": { "enumName": "users_permissions", "values": ["ADMIN", "USER"], "columnName": "" }
            }
        },
        "posts": {
            "primaryKey": {
                "constraintName": "posts_pkey",
                "constraintType": "PRIMARY KEY",
                "columnNames": ["post_id"]
            },
            "keys": [
                {
                    "constraintName": "posts_author_id_foreign",
                    "constraintType": "FOREIGN KEY",
                    "columnNames": ["author_id"]
                },
                {
                    "constraintName": "posts_co_author_foreign",
                    "constraintType": "FOREIGN KEY",
                    "columnNames": ["co_author"]
                },
                { "constraintName": "posts_pkey", "constraintType": "PRIMARY KEY", "columnNames": ["post_id"] }
            ],
            "uniqueKeyCombinations": [["post_id"]],
            "relations": [
                {
                    "toTable": "users",
                    "alias": "author_",
                    "joins": [{ "fromColumn": "author_id", "toColumn": "user_id" }],
                    "type": "belongsTo"
                },
                {
                    "toTable": "users",
                    "alias": "co_author_",
                    "joins": [{ "fromColumn": "co_author", "toColumn": "user_id" }],
                    "type": "belongsTo"
                },
                {
                    "toTable": "team_members",
                    "alias": "team_members",
                    "joins": [{ "fromColumn": "post_id", "toColumn": "member_post_id" }],
                    "type": "hasMany"
                }
            ],
            "columns": {
                "post_id": {
                    "dbType": "int4",
                    "columnDefault": "nextval('posts_post_id_seq'::regclass)",
                    "nullable": false,
                    "columnName": "post_id",
                    "tsType": "number"
                },
                "author": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "author",
                    "tsType": "string"
                },
                "author_id": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "author_id",
                    "tsType": "number"
                },
                "co_author": {
                    "dbType": "int4",
                    "columnDefault": null,
                    "nullable": true,
                    "columnName": "co_author",
                    "tsType": "number"
                },
                "message": {
                    "dbType": "varchar",
                    "columnDefault": null,
                    "nullable": false,
                    "columnName": "message",
                    "tsType": "string"
                },
                "rating_average": {
                    "dbType": "float4",
                    "columnDefault": "'0'::real",
                    "nullable": true,
                    "columnName": "rating_average",
                    "tsType": "number"
                },
                "created": {
                    "dbType": "timestamptz",
                    "columnDefault": "CURRENT_TIMESTAMP",
                    "nullable": true,
                    "columnName": "created",
                    "tsType": "Date"
                },
                "deleted": {
                    "dbType": "bool",
                    "columnDefault": "false",
                    "nullable": true,
                    "columnName": "deleted",
                    "tsType": "boolean"
                }
            },
            "softDelete": {
                "dbType": "bool",
                "columnDefault": "false",
                "nullable": true,
                "columnName": "deleted",
                "tsType": "boolean"
            },
            "enums": {
                "posts_subscription_level": {
                    "enumName": "posts_subscription_level",
                    "values": ["BRONZE", "GOLD", "SILVER"],
                    "columnName": ""
                },
                "posts_permissions": { "enumName": "posts_permissions", "values": ["ADMIN", "USER"], "columnName": "" }
            }
        }
    }
}
```
