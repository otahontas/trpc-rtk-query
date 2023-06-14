# tRPC - RTK Query -bindings

Generate rtk query api endpoints automatically from your trpc setup!

very work in progress

## TODO

- Generate rtk query api with given `AppRouter` typings (simplest version)
- Allow passing in custom client, use that instead of generating internal client
- Allow passing in already existing api
- Allow merging extra parameters to endpoints to e.g. make optimistic updates possible
- ci
- publish package
- remove unnecessary stuff from distributed package (e.g. don't have jsx in tsconfig etc)
- this is very react heavy approach, test against vue and svelte too
