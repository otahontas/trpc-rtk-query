---
"trpc-rtk-query": patch
---

Fix queryFn type definitions to use proper types instead of any

The queryFn in endpoint definitions now uses BaseQueryApi and TRPCRequestOptions types instead of any, providing better type safety when working with custom queryFn implementations. This resolves issue #41.
