# Testing

Install dependencies with `npm ci`, then run `npm run typecheck`, `npm run lint`,
and `npm run build`.

## Database integration and installed-package tests

Use disposable databases: the integration suites recreate tables in the `tests`
database. PostgreSQL must be available on localhost:5432 as `postgres` with trust
authentication, or MySQL on localhost:3306 as `root` with an empty password.

```sh
npm run test:pg
DB=pg npm run test:package

npm run test:mysql
DB=mysql npm run test:package
```

Run each pair sequentially. The integration suites populate the fixture database
and generate the reference schema consumed by the package smoke test.

The smoke test packs the current build, installs the tarball into a temporary
consumer directory, and invokes the installed CLI. It compares JSON output with
the integration fixture and a second generation, excluding the generation
timestamp. It also imports CommonJS and ES module output, compiles a TypeScript
consumer, checks the package entry point, and checks unsuccessful CLI exit codes.
The consumer uses the repository's installed TypeScript and Node declaration
versions; declaration-library checking is skipped. Package installation requires
access to the npm registry. The temporary consumer is removed after the test.

## CI and releases

Pull requests run validation regardless of which files change. Database tests
and package smoke tests run on Node.js 16 and 22 against PostgreSQL 13 and MySQL
5.7. Node.js 16 is retained as a compatibility check, not a recommendation for
new deployments. This matrix does not assert coverage of other database versions.

Pushes to `main` run validation directly. Pushes to `master` run the release
workflow, which calls the same validation workflow. Publishing requires every
validation job to succeed for that revision. Database jobs have bounded readiness
checks and print container diagnostics on failure.
