---
name: openapi-update
description: Procedures and checklist for reviewing the ExpenseIt codebase (API endpoints) and updating the OpenAPI documentation so documentation/api/v1/openapi.yaml stays accurate.
---

## Purpose
This skill describes a repeatable process for: reviewing the server
code (routes/controllers/DTOs), identifying documentation drift, and
updating the OpenAPI YAML under `documentation/api/v1/openapi.yaml` to
match runtime behavior and request/response contracts.

## Scope

- Focus: HTTP API endpoints implemented in `src/api/routes` and
	`src/api/controllers`.
- Update location: `documentation/api/v1/openapi.yaml`.
- Validate: schema correctness, security schemes, request/response
	examples, status codes, and common error responses.

## Quick mapping notes
- Routes: `src/api/routes/*.ts` — these register paths and middleware.
- Controllers: `src/api/controllers/*.ts` — implement handler logic.
- DTOs / types: `src/application/dtos` (and `src/application` folders)
	— source of request/response shapes.
- Auth utilities: `src/api/utils/jwtUtils.ts` and `src/api/middleware`
	— use these to confirm authentication schemes (Bearer, scopes).

## Step-by-step process
1. High-level inventory
	 - List all registered routes: open `src/api/routes/index.ts` and
		 each route file (`auth.route.ts`, `transaction.route.ts`,
		 `user.route.ts`). Note HTTP methods and path templates.

2. For each route
	 - Open its controller handler in `src/api/controllers` and verify:
		 - Expected request params, query params, and body shape.
		 - Required authentication/authorization and response codes.
	 - Find the DTO or TypeScript interface used (in
		 `src/application/dtos` or controller's import) and extract the
		 fields and types.
	 - If the handler calls a service that transforms output, inspect
		 the final shape returned to the client.

3. Update `openapi.yaml`
	 - Paths: add/update the path + method node for each endpoint.
	 - Parameters: translate path/query/header params to OpenAPI
		 parameter objects with types and required flags.
	 - Request bodies: reference or inline schemas matching DTOs.
	 - Responses: add documented response codes, Content-Type and
		 response schema. Prefer named components/schemas for reuse.
	 - Security: ensure a Bearer JWT scheme is declared and applied
		 where middleware requires it.
	 - Examples: add at least one realistic example per request/response.

4. Use components for consistency
	 - Put shared request/response shapes under `components/schemas`.
	 - Add `components/responses` for shared error shapes
		 (401/403/422/500).

5. Validate and test the spec
	 - Run a validator (local or CI): `swagger-cli` or `openapi-cli`.
	 - Optionally run an `ajv` validation for example JSON against the
		 schema.

## Commands (examples)
- Install a validator locally if needed:

	npm install --save-dev @apidevtools/swagger-cli

- Validate the spec:

	npx swagger-cli validate documentation/api/v1/openapi.yaml

- (Optional) Use `openapi-generator` to regenerate clients or ensure
	the spec remains compatible with generated outputs.

## Checklist before committing
- [ ] Every route in `src/api/routes` has a corresponding OpenAPI
	path or an intentional omission documented.
- [ ] Request bodies and responses accurately reflect DTOs and
	runtime shapes.
- [ ] Security schemes match the authentication middleware
	(`Bearer`/JWT) and are applied to protected endpoints.
- [ ] Common error responses are documented and reused via
	`components/responses`.
- [ ] Examples are present for at least one success and failure case
	per endpoint.
- [ ] `npx swagger-cli validate` completes without errors.

## Commit & PR guidance
- Use a focused commit message, e.g. "docs(openapi): sync endpoints for
	transactions and auth".
- In the PR description include: changed endpoints, reason for drift,
	sample curl commands that exercise modified docs, and a note if
	generated clients need regeneration.

## Tips and gotchas
- When DTOs diverge from runtime shapes (e.g., service adds/filters
	fields), document the final shape returned by the controller, not
	the internal DB model.
- Prefer explicit status codes over a single generic 200. Document
	201 for creations, 204 for delete-without-body, 4xx for client
	validation failures.
- Keep `components/schemas` small and composable; use $ref to avoid
	duplication.

## Follow-up
After updating the YAML you can optionally:

- Run `openapi-generator` to regenerate clients and add integration
	tests to ensure the runtime matches the generated contracts.
- Add a CI job that validates `documentation/api/v1/openapi.yaml` on
	every PR.

If you want, I can now:

- Scan `src/api/routes` and `src/api/controllers` and produce a
	draft diff for `documentation/api/v1/openapi.yaml`.
- Or run `npx swagger-cli validate` and report results.

