---
"trpc-rtk-query": minor
---

Remove createApi function and support only enhancing existing apis. This way we have to support only
one method of generating hooks for apis. There's now a `createEmptyApi` helper to make it easier to
create a base api without any endpoints, which can be then passed to api.
