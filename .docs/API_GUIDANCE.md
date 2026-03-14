# API_GUIDANCE

This document exists to outline some of the core API design patterns that will be enforced across this codebase. It is not meant to be an exhaustive list of all patterns, but rather a set of guidelines to help ensure consistency and maintainability across the API. Using these patterns will help ensure that the API is easy to understand and use for both internal and external developers. It will also help ensure that the API is scalable and maintainable as the codebase grows.

## Patterns

### Structured Responses

The API defines two response types and all responses should be wrapped in one of these. They can be found in `src/application/dtos/common/response.dto.ts` and are `ApiResponse<T> and ApiErrorResponse<T>`. The former is used for successful responses and the latter is used for error responses. Both types have a generic type parameter that can be used to specify the shape of the data being returned.

### Consistent Error Handling

The API is designed with two error surfaces: Domain errors and System errors. Domain errors are errors that occur due to business logic and are expected to happen during normal operation of the API. System errors are unexpected errors that occur due to issues with the infrastructure or codebase. Both types of errors should be handled consistently across the API. A common error handling middleware is used to catch and handle errors at the exit point. System or Api errors can be found in `src/application/errors/index.ts` and domain errors can be found in `src/domain/errors/index.ts`. When throwing errors, the appropriate type should be used to ensure that the error is handled correctly by the error handling middleware.

Api errors are thrown directly in the controller layer and not mapped from domain errors. Domain errors are thrown in the service layer and should be mapped to Api errors in the controller layer. This is to ensure that the controller layer is responsible for handling the translation of domain errors to API errors, which allows for better separation of concerns and makes it easier to maintain the codebase.

## Prefer Request Bodies over Route Parameters or Query Parameters

When designing API endpoints, it is generally recommended to use request bodies for passing data instead of query parameters. This is because request bodies can handle larger and more complex data structures, while query parameters are limited in length and can become unwieldy when dealing with large amounts of data. Additionally, using request bodies can help improve the security of the API by keeping sensitive data out of the URL, which can be logged or cached by intermediaries. Overall, using request bodies can lead to a cleaner and more secure API design.

A design rule of thumb:
Use Route Parameters for identifying specific resources (e.g., /api/users/{userId}). Think of this as a pointer to a specific resource in the system.
Use Query Parameters for filtering, sorting, or specifying options for the request (e.g., /api/transactions?userId=123&sort=asc). Think of this as providing additional instructions on how to retrieve or manipulate the resource.
Use Request Bodies for creating or updating resources, especially when the data is complex or sensitive (e.g., POST /api/transactions with a JSON body containing transaction details). Think of this as providing the content or data that you want to create or update in the system.

example:

```typescript
// GET /api/transactions?userId=123
// In this example, the userId is passed as a query parameter to specify which user's transactions to retrieve.
// POST /api/transactions?userId=123
// In this example, the userId is passed as a query parameter to specify which user the new transaction should be associated with, while the transaction details (e.g., amount, description) are passed in the request body.
// GET /api/transactions/456
// In this example, the transactionId is passed as a route parameter to specify which specific transaction to retrieve.
```
