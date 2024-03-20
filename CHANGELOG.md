# trpc-rtk-query

## 0.1.0

### Minor Changes

- [#214](https://github.com/otahontas/trpc-rtk-query/pull/214) [`e3f6bd1`](https://github.com/otahontas/trpc-rtk-query/commit/e3f6bd106c88d6c52fd49c0301437913dab88699) Thanks [@otahontas](https://github.com/otahontas)! - Remove createApi function and support only enhancing existing apis. This way we have to support only
  one method of generating hooks for apis. There's now a `createEmptyApi` helper to make it easier to
  create a base api without any endpoints, which can be then passed to api.

### Patch Changes

- [#65](https://github.com/otahontas/trpc-rtk-query/pull/65) [`09c91b1`](https://github.com/otahontas/trpc-rtk-query/commit/09c91b16a7798b6774bebfadc60f5e38f7d77032) Thanks [@otahontas](https://github.com/otahontas)! - Add tests for bigger router and queries after adding endpointoptions

- [#103](https://github.com/otahontas/trpc-rtk-query/pull/103) [`6284625`](https://github.com/otahontas/trpc-rtk-query/commit/6284625b49c5a500ef54a8c4e8cc32fca1355035) Thanks [@bryan-hunter](https://github.com/bryan-hunter)! - update peer deps and stop using internal dist imports from redux toolkit

## 0.0.3

### Patch Changes

- [#36](https://github.com/otahontas/trpc-rtk-query/pull/36) [`d75d397`](https://github.com/otahontas/trpc-rtk-query/commit/d75d397b5698ce6478eb6baec6da1f49d582a001) Thanks [@otahontas](https://github.com/otahontas)! - Make it possible to pass in rtk query api options when creating new api

- [#49](https://github.com/otahontas/trpc-rtk-query/pull/49) [`be05b59`](https://github.com/otahontas/trpc-rtk-query/commit/be05b59ee4d347ec733e57598cb39cc6ffc2dd62) Thanks [@otahontas](https://github.com/otahontas)! - Add initial docs aimed for users (in readme)

- [#37](https://github.com/otahontas/trpc-rtk-query/pull/37) [`db71bbe`](https://github.com/otahontas/trpc-rtk-query/commit/db71bbeb960ae2c3b83dd1556064ac9db256e312) Thanks [@otahontas](https://github.com/otahontas)! - Replace homebrew assertion and typeguard funcs with is-what

- [#25](https://github.com/otahontas/trpc-rtk-query/pull/25) [`bd50030`](https://github.com/otahontas/trpc-rtk-query/commit/bd5003046bb807ef2147b72329acdce6b6c647b0) Thanks [@otahontas](https://github.com/otahontas)! - Force users to pass in typed client or getClient func

- [#28](https://github.com/otahontas/trpc-rtk-query/pull/28) [`e99a24b`](https://github.com/otahontas/trpc-rtk-query/commit/e99a24bc2366ccac5e32e5649b9b200c8075d978) Thanks [@otahontas](https://github.com/otahontas)! - Simplify type and function names and make them resemble rtk query

- [#48](https://github.com/otahontas/trpc-rtk-query/pull/48) [`6dcf7b4`](https://github.com/otahontas/trpc-rtk-query/commit/6dcf7b45e3d9a950ef0adba618c943a81efc102f) Thanks [@otahontas](https://github.com/otahontas)! - Allow passing endpoint options (e.g.providesTags, onQueryStarted) for each generated trpc endpoint

## 0.0.2

### Patch Changes

- [#17](https://github.com/otahontas/trpc-rtk-query/pull/17) [`20668a6`](https://github.com/otahontas/trpc-rtk-query/commit/20668a621f396ab16b51e841267f00ba6d4f2573) Thanks [@otahontas](https://github.com/otahontas)! - Allow using rtk query create api settings when creating new api

- [#11](https://github.com/otahontas/trpc-rtk-query/pull/11) [`a7a466a`](https://github.com/otahontas/trpc-rtk-query/commit/a7a466aa09616e2194f3d0fb808dbd31c9346cd3) Thanks [@otahontas](https://github.com/otahontas)! - Add looser eslint rules for tests

- [#10](https://github.com/otahontas/trpc-rtk-query/pull/10) [`a9f691c`](https://github.com/otahontas/trpc-rtk-query/commit/a9f691c7635cc12af493c3b21e1698c54886dbed) Thanks [@otahontas](https://github.com/otahontas)! - Add MIT license to project

- [#5](https://github.com/otahontas/trpc-rtk-query/pull/5) [`85dbaf4`](https://github.com/otahontas/trpc-rtk-query/commit/85dbaf4789487cf558a2ef7a560f508e9573c7a8) Thanks [@otahontas](https://github.com/otahontas)! - add dependabot

- [#11](https://github.com/otahontas/trpc-rtk-query/pull/11) [`a7a466a`](https://github.com/otahontas/trpc-rtk-query/commit/a7a466aa09616e2194f3d0fb808dbd31c9346cd3) Thanks [@otahontas](https://github.com/otahontas)! - Add tests for proxy helpers

## 0.0.1

### Patch Changes

- [#1](https://github.com/otahontas/trpc-rtk-query/pull/1) [`4a1b01f`](https://github.com/otahontas/trpc-rtk-query/commit/4a1b01f45d0b59d2d6dd6302aaeafde189772d2c) Thanks [@otahontas](https://github.com/otahontas)! - Setup proper release workflow with changelogs
