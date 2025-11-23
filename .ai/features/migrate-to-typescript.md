# Migration: JavaScript -> TypeScript (ExpenseIt-API)

Purpose

- Provide a practical, low-risk plan to migrate the codebase from JavaScript to TypeScript.
- Focus on incremental conversion, developer ergonomics, and keeping the app runnable in dev while converting files.

High level approach

1. Add TypeScript tooling and types as dev-dependencies.
2. Introduce a `tsconfig.json` and enable an incremental migration (allowJs + checkJs or isolatedModules options).
3. Convert files in small batches (config + types -> utils -> services -> controllers -> routes -> tests), verify at each step.
4. Replace runtime-only imports (generated .ts Prisma client) with `@prisma/client` usage and keep Prisma generation in place.
5. Add build/test scripts and CI validation.

Estimated time: 1–2 days for a single developer for a small API (this repo), depending on test coverage and familiarity with TS.

Commands (install these first)

- Install TypeScript and common types:
  - `npm install -D typescript ts-node @types/node`
  - `npm install -D @types/express @types/cookie-parser @types/cors @types/cookie-parser @types/jsonwebtoken` (add specific @types entries as needed)
  - Keep `@prisma/client` and `prisma` pinned and run `npx prisma generate` after installing.

Initial repo changes

- Add `tsconfig.json` (start permissive then tighten):
  - `allowJs: true` (lets you run TS compiler while .js files still exist)
  - `checkJs: false` initially; later enable `--noEmit` type-check pass with `tsc --noEmit`
  - `outDir: ./dist` for build output
  - `rootDir: ./src`
- Add `ts-node` for running TypeScript in dev if you prefer `node`-less dev: update `package.json` scripts.
- Add `src/types` (or `src/@types`) folder for app-level type definitions (e.g., `express` request extensions).

Suggested `tsconfig.json` (starter)

```
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false, // start false, enable incrementally
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "allowJs": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Package.json script updates (examples)

- Add scripts:
  - `"build": "tsc"`
  - `"dev": "ts-node ./src/index.ts"` (or `nodemon --watch src --exec ts-node src/index.ts`)
  - `"typecheck": "tsc --noEmit"`
  - `"ai:run"` left as-is for ai-runner
- Add a `postinstall` or `prepare` hook to run `prisma generate` if desired: `"postinstall": "prisma generate"`

Step-by-step file migration plan (safe, incremental)

1. Add a `src/types/` (or `@types`) folder:

   - Define domain types used across the app (e.g., `User`, `Account`, `Transaction`, `RefreshToken`) derived from Prisma schema.
   - Add Express augmentation types for `Request` to include typed `user` in middleware: `declare global { namespace Express { interface Request { user?: User } } }`.

2. Convert config and entry points

   - Convert `src/config/db.js` -> `src/config/db.ts`:
     - Import from `@prisma/client` (not generated .ts files) and type `PrismaClient`.
     - Export typed `initDb(): PrismaClient` and ensure global singleton typing is correct.
   - Convert `index.js` -> `src/index.ts` and update imports to `.js` -> `.ts` equivalents.

3. Convert utility modules

   - `src/utils/jwtUtils.js` -> `src/utils/jwtUtils.ts`: add strong types for tokens, payloads, and helper signatures.
   - `src/utils/timeUtils.js` -> `timeUtils.ts` (small typed helper functions).

4. Convert middleware

   - `auth.middleware.js`, `error.middleware.js` -> typed middleware signatures: `Request`, `Response`, `NextFunction` from `express`.
   - Add proper typings for `req.user` where used.

5. Convert services

   - `authService.js`, `transactionService.js` -> TypeScript with typed inputs/outputs (DTOs). Keep business logic identical but add return types like `Promise<ServiceResult<T>>`.

6. Convert controllers and routes

   - `controllers/*.js` and `routes/*.js` -> `.ts` with typed request/response.
   - Ensure controllers import typed services and properly type `req.body` or use request validators.

7. Convert remaining files (tests, scripts)

   - Migrate test files to `.ts` if using ts-node or keep tests in JS but run type-check separately.

8. Tighten `tsconfig` and enable `strict` and `noImplicitAny` gradually
   - After the codebase compiles and runs, enable `strict` and fix type errors incrementally.

Prisma and generated client notes

- Continue using `@prisma/client` runtime import in `db.ts`.
- Ensure `npx prisma generate` runs after `npm install` when needed; the TypeScript Prisma client types are available via `@prisma/client`.
- Avoid importing `generated/prisma/client.ts` directly at runtime; prefer `@prisma/client` or generate JS client.

Express + typing patterns

- Use `RequestHandler` or `(req: Request, res: Response, next: NextFunction) => Promise<void>` with async handlers.
- For typed `req.body`, use a local interface or DTO and narrow inside the handler (or use a validation library such as `zod` with type inference).

Third-party types to add (likely list)

- `@types/express`, `@types/cors`, `@types/cookie-parser`, `@types/jsonwebtoken`, `@types/node`.
- If using `bcrypt`, add `@types/bcrypt` or use `bcryptjs` typed package.

ESM/CJS and Node settings

- Your project currently uses ESM (`import` syntax). Keep `module` and `target` in `tsconfig` consistent with runtime.
- If you compile to `dist` and run `node dist/index.js`, ensure transpiled module type is supported by Node or use `ts-node` in dev.

Linting and formatting

- Add or extend ESLint with TypeScript support:
  - `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
  - Update `.eslintrc` to use `@typescript-eslint/parser` and include plugins.
- Keep Prettier config unchanged or add `prettier` plugin for ESLint.

CI checks

- Add `npm run typecheck` and `npm run build` to CI pipeline to ensure PRs don't break types.

Testing and validation

- Run integration tests (if present) after converting related files.
- Add a migration step in CI to run `npx prisma migrate deploy` or `prisma db push` depending on workflow.

Risk, tradeoffs, and recommendations

- Start permissive (allowJs) so you can ship small patches. Tighten `strict` when comfortable.
- Keep business logic unmodified; aim to add types and not refactor large blocks concurrently.
- The largest friction is typing Express request bodies and middleware augmentation — establish a small pattern (DTOs or `zod`) early.

Example incremental work plan (small tasks)

1. Add TypeScript tooling & `tsconfig` (30–60m)
2. Convert `src/config/db.js` -> `src/config/db.ts` and `index.js` -> `src/index.ts` (1–2 hours)
3. Add `src/types/*` and express augmentation (30–60m)
4. Convert utils and services (2–3 hours)
5. Convert controllers and routes, run the app, fix runtime issues (2–4 hours)
6. Enable `typecheck` in CI and iterate on `strict` (ongoing)

Checklist to mark progress

- [ ] `tsconfig.json` added
- [ ] Dev dependencies installed (`typescript`, `ts-node`, `@types/*`)
- [ ] `src/index.ts` + `src/config/db.ts` converted and app runs
- [ ] `src/types` folder with core domain types
- [ ] All `src/*.js` files moved or copied to `.ts` counterparts
- [ ] `npm run build` succeeds and `npm run typecheck` passes
- [ ] CI updated to run `typecheck` and `build`

Helpful references

- TypeScript + Node ESM: https://www.typescriptlang.org/docs/handbook/esm-node.html
- Express Request augmentation pattern: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
- Prisma + TypeScript: https://www.prisma.io/docs/concepts/components/prisma-client

If you'd like, I can:

- Generate a `tsconfig.json` and add it to the repo.
- Patch `src/config/db.js` and `index.js` to `.ts` variants as a starting point.
- Add the minimal `package.json` script changes and the list of `npm install` commands to run.

Which single item should I do next for you? (e.g., add `tsconfig.json`, convert `db.js` to `db.ts`, or add install commands to README)
