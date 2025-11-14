# React Native Example

This example demonstrates using `trpc-rtk-query` in a React Native application with Expo.

## Features

- **Expo**: Modern React Native development
- **tRPC Client**: Connect to any tRPC backend
- **RTK Query**: Powerful data fetching for mobile
- **Type Safety**: Full type inference on mobile

## Structure

```
05-react-native/
├── src/
│   ├── api/          # tRPC RTK Query setup
│   ├── store/        # Redux store
│   ├── screens/      # App screens
│   └── components/   # Reusable components
└── package.json
```

## Quick Start

```bash
npm install
npm start
```

Press `i` for iOS simulator or `a` for Android emulator.

## Mobile-Specific Setup

### 1. API Configuration

```typescript
// src/api/index.ts
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { enhanceApi } from "trpc-rtk-query";

const API_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:3000/trpc"  // Android emulator
    : "http://localhost:3000/trpc" // iOS simulator
  : "https://api.production.com/trpc";

const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: API_URL })],
});

export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
});
```

### 2. Using Hooks in Components

```typescript
// src/screens/HomeScreen.tsx
import { useUser_ListQuery } from "../api";

export default function HomeScreen() {
  const { data, isLoading } = useUser_ListQuery();

  if (isLoading) return <ActivityIndicator />;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <UserCard user={item} />}
    />
  );
}
```

## Platform Considerations

- **Network URLs**: Different URLs for Android/iOS emulators
- **Offline Support**: RTK Query cache persists between sessions
- **Performance**: Optimized queries reduce mobile data usage
- **Type Safety**: Catch errors before they reach production

Perfect for building type-safe mobile apps with React Native.
