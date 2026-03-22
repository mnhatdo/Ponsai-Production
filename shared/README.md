# Shared Module

This directory contains shared TypeScript types, constants, and utilities used across both the frontend (Angular) and backend (Node.js/Express).

## Structure

```
shared/
├── src/
│   ├── types.ts      # Shared TypeScript interfaces
│   ├── constants.ts  # Shared constants
│   ├── utils.ts      # Shared utility functions
│   └── index.ts      # Main export file
├── package.json
└── tsconfig.json
```

## Purpose

- **Type Safety**: Ensures consistent data structures between frontend and backend
- **DRY Principle**: Avoids duplication of type definitions
- **Maintainability**: Single source of truth for shared logic

## Usage

### In Backend

```typescript
import { IProduct, IUser, formatPrice } from '../shared/src';
```

### In Frontend

```typescript
import { IProduct, IUser, formatPrice } from '../../../shared/src';
```

## Building

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` folder with type definitions.
