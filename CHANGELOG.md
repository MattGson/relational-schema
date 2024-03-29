## [0.6.1](https://github.com/MattGson/relational-schema/compare/v0.6.0...v0.6.1) (2023-02-04)


### Bug Fixes

* **ci:** fixes test failures ([37a8dad](https://github.com/MattGson/relational-schema/commit/37a8dad5ba3e93f83534a24e9128a790b57cc916))
* **tests:** fixes test and lint issues ([f0014ea](https://github.com/MattGson/relational-schema/commit/f0014ea29f096ca6e23e6abf1c42f2d6e1717d42))

# [0.6.0](https://github.com/MattGson/relational-schema/compare/v0.5.1...v0.6.0) (2022-07-25)


### Features

* **postgres:** provides maximum char length for columns ([62c1e5c](https://github.com/MattGson/relational-schema/commit/62c1e5c7754f803366b523e9a61a16930e987d6e))

## [0.5.1](https://github.com/MattGson/relational-schema/compare/v0.5.0...v0.5.1) (2021-10-25)


### Bug Fixes

* **introspect:** fixes ordering of tables, columns etc to be stable ([09acd99](https://github.com/MattGson/relational-schema/commit/09acd99deaa1a502998aae47f69170f0d704e6ed)), closes [#25](https://github.com/MattGson/relational-schema/issues/25)

# [0.5.0](https://github.com/MattGson/relational-schema/compare/v0.4.4...v0.5.0) (2021-10-11)


### Features

* **constraint-actions:** adds schema for referential constraint actions (on delete, on update) ([78d39b6](https://github.com/MattGson/relational-schema/commit/78d39b627803867a4e4d3db8149ed3cbeec93127))

## [0.4.4](https://github.com/MattGson/relational-schema/compare/v0.4.3...v0.4.4) (2021-09-27)


### Bug Fixes

* **introspect:** fixes crash on empty contraints list ([8c23049](https://github.com/MattGson/relational-schema/commit/8c23049220accd6727d559cdc23a22ae48aeeffe))

## [0.4.3](https://github.com/MattGson/relational-schema/compare/v0.4.2...v0.4.3) (2021-05-26)


### Bug Fixes

* **cardinality-resolver:** fixes bug with finding one-to-one relations ([341d4ae](https://github.com/MattGson/relational-schema/commit/341d4ae8ad4debe3ecb2a95c5427ef88336dda4a))

## [0.4.2](https://github.com/MattGson/relational-schema/compare/v0.4.1...v0.4.2) (2021-05-11)


### Bug Fixes

* **gen:** makes export format consistent across file formats ([3a3867f](https://github.com/MattGson/relational-schema/commit/3a3867fb6a59a877bc43f7eaf7289a3eb380de99))

## [0.4.1](https://github.com/MattGson/relational-schema/compare/v0.4.0...v0.4.1) (2021-05-11)


### Bug Fixes

* **config:** fixes package json ([aecde0b](https://github.com/MattGson/relational-schema/commit/aecde0b8de0d9246b0246acb84f620b71977e989))
* **types:** added index types ([35604c6](https://github.com/MattGson/relational-schema/commit/35604c608d4b159927f480cafedf70cbd8f203df))
* **types:** included types export ([a4d63c9](https://github.com/MattGson/relational-schema/commit/a4d63c97529da88e005a9806508f533ba977b5f2))

# [0.4.0](https://github.com/MattGson/relational-schema/compare/v0.3.1...v0.4.0) (2021-05-11)


### Features

* **cli:** print a relation tree from a table ([f73d689](https://github.com/MattGson/relational-schema/commit/f73d689cb1849427518f319e88c253e40b296682)), closes [#13](https://github.com/MattGson/relational-schema/issues/13)

## [0.3.1](https://github.com/MattGson/relational-schema/compare/v0.3.0...v0.3.1) (2021-05-10)


### Bug Fixes

* **cli:** fixes CLI entrypoint ([45e14b5](https://github.com/MattGson/relational-schema/commit/45e14b516d61566e4ee89b0f7ddd144829faa90d))

# [0.3.0](https://github.com/MattGson/relational-schema/compare/v0.2.3...v0.3.0) (2021-05-10)


### Features

* **transitive-relations:** added support for transitive (many-to-many) relations ([70e1aca](https://github.com/MattGson/relational-schema/commit/70e1aca19a63516560ef57b89c4fadca16406f05)), closes [#14](https://github.com/MattGson/relational-schema/issues/14)

## [0.2.3](https://github.com/MattGson/relational-schema/compare/v0.2.2...v0.2.3) (2021-05-10)


### Bug Fixes

* **introspect:** fixed relations introspection. Cardinality and column naming are consistent now ([7b4aeb2](https://github.com/MattGson/relational-schema/commit/7b4aeb261d8611a8fdcc1ae51070c4c92e01001a))

## [0.2.2](https://github.com/MattGson/relational-schema/compare/v0.2.1...v0.2.2) (2021-05-06)


### Bug Fixes

* **all:** large refactoring to project setup, structure ([cb318b4](https://github.com/MattGson/relational-schema/commit/cb318b4a02aac287845749a0c5417665f66f52bb))


### Performance Improvements

* **introspect:** batches queries to bulk load for all tables up front ([3651b74](https://github.com/MattGson/relational-schema/commit/3651b740a31a6ad393bc4a10a010bf45fbfda8fb))

## [0.2.1](https://github.com/MattGson/relational-schema/compare/v0.2.0...v0.2.1) (2021-04-29)


### Bug Fixes

* **ci:** fixed docs ci flow ([546a29a](https://github.com/MattGson/relational-schema/commit/546a29a767208daa34dc3f73e363e3c6f239f4da))

# [0.2.0](https://github.com/MattGson/relational-schema/compare/v0.1.8...v0.2.0) (2021-04-29)


### Features

* **cli:** adds an optional prettierConfig argument ([d3c2bea](https://github.com/MattGson/relational-schema/commit/d3c2bea8da39fe3ed37b6c76e0704f8c2d59d062)), closes [#3](https://github.com/MattGson/relational-schema/issues/3)

## [0.1.8](https://github.com/MattGson/relational-schema/compare/v0.1.7...v0.1.8) (2021-04-28)


### Bug Fixes

* **ci:** fixed release config ([ce9f52b](https://github.com/MattGson/relational-schema/commit/ce9f52bf6319bba043ff18db71f8753e93e73440))


### 0.1.4 (2021-04-28)


### Bug Fixes

* **ci:** fixes standard-version ([2b72fe3](https://github.com/MattGson/relational-schema/commit/2b72fe30ff85ef8891e92a1a813442956aa05684))

### 0.1.3 (2021-04-28)


### Bug Fixes

* **ci:** change to commitizen action ([06f2c5a](https://github.com/MattGson/relational-schema/commit/06f2c5a24826dc6877e8cceedfc657790beb0f53))
* **ci:** fixes workflows ([f482c71](https://github.com/MattGson/relational-schema/commit/f482c71c9c43b40a28d1292010d4f2be879f4920))


### Others

* **git:** add commitizen for consistent commit formatting ([ce63ef8](https://github.com/MattGson/relational-schema/commit/ce63ef8d93f1d3122bf017815d613b5769b33b84))


### CI

* **publish:** add configs for auto-versioning on CI ([f80a38a](https://github.com/MattGson/relational-schema/commit/f80a38abf7c356e0a07125a39bdd7e65854fbdc5))

## 0.1.2 (2021-04-28)

### Fix

- **ci**: fixes workflows
- **ci**: change to commitizen action
