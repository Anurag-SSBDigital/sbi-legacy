cl# Gemini Project Context: shadcn-admin

This document provides context for the `shadcn-admin` project to assist the Gemini AI assistant.

## Overview

This is a modern web application built with React and TypeScript. It serves as an admin dashboard and uses a feature-based architecture for scalability and maintainability. The UI is built with shadcn/ui and Tailwind CSS.

## Tech Stack

- **Framework:** React
- **Language:** TypeScript
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Routing:** TanStack Router
- **State Management:** Zustand and React Context
- **Deployment:** Netlify

## Key Libraries

- **`@tanstack/react-query`**: For data fetching and caching.
- **`@tanstack/react-router`**: For type-safe routing.
- **`@tanstack/react-table`**: For creating tables.
- **`zod`**: For schema validation.
- **`react-hook-form`**: For building forms.
- **`openapi-fetch` & `openapi-react-query`**: For making type-safe API calls based on an OpenAPI specification.
- **`lucide-react`**: For icons.

## Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Builds the application for production.
- `pnpm lint`: Lints the codebase using ESLint.
- `pnpm format`: Formats the code using Prettier.
- `pnpm api-type-gen`: Generates TypeScript types from the OpenAPI schema.
- `pnpm knip`: Finds and removes unused files, exports, and dependencies.

## Code Style and Conventions

- **Linting:** ESLint is used for code quality. The configuration is in `eslint.config.js`.
- **Formatting:** Prettier is used for code formatting. The configuration is in `.prettierrc`.
- **Imports:** Imports are automatically sorted using `@trivago/prettier-plugin-sort-imports`.

## API Integration

- API calls are managed through `openapi-fetch` and `openapi-react-query`.
- The API client is configured in `src/lib/api.ts`.
- An authentication middleware automatically attaches a bearer token to requests and handles 401 errors.
- The base API URL is configured via the `VITE_APP_API_URL` environment variable.
- src\types\api\v1.d.ts contains openapi generated types for api.
