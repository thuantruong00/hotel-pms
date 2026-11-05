# API Development Guidelines

## Endpoint Naming

- Use RESTful endpoints.
- Use plural nouns for collections.
- Use kebab-case for URL paths.
- Use explicit action endpoints for state transitions.

Examples:

```text
GET   /api/rooms
GET   /api/rooms/:roomId
POST  /api/room-stays
POST  /api/room-stays/:stayId/check-in
POST  /api/room-stays/:stayId/check-out
POST  /api/room-stays/:stayId/cancel
```

## Request Validation

- Validate all request parameters and request bodies.
- Validate UUID values.
- Validate date ranges.
- Validate enum values.
- Validate state transitions in the service layer.
- Do not trust client-calculated amounts.

## Response Format

Success:

```json
{
  "data": {},
  "message": "Operation completed successfully"
}
```

Error:

```json
{
  "error": {
    "code": "ROOM_ALREADY_RESERVED",
    "message": "The selected room is already reserved"
  }
}
```

## HTTP Status Codes

- `200`: successful read or update
- `201`: successful creation
- `204`: successful deletion without a response body
- `400`: malformed request
- `404`: resource not found
- `409`: business conflict
- `422`: validation failure
- `500`: unexpected server error

## Authentication and Authorization

- Authenticate the user before checking permissions.
- Reject inactive or locked users.
- Enforce authorization on the backend, not only in the frontend.
- Return `401` when the user is unauthenticated.
- Return `403` when the user is authenticated but forbidden.
- Read roles from the authenticated server-side context.
- Do not trust role or user identity values supplied by the client.
- Follow `docs/api/authorization.md` for the permission matrix.

## Architecture Rules

- Controllers must remain thin.
- Business logic belongs in services.
- Database access belongs in repositories or services.
- Use transactions for multi-table operations.
- Do not expose database errors directly to clients.
- Do not expose password hashes or full identity numbers unnecessarily.

## Backend Layer Responsibilities

The standard request flow is:

```text
Router
  -> Validator
  -> Controller
  -> Service
  -> Repository
  -> Entity / Database
```

### Router

Routers define HTTP endpoints and compose middleware.

Routers may contain:

- HTTP method and URL path.
- Validation middleware.
- Authentication and authorization middleware.
- Controller handlers.

Routers must not contain:

- Business rules.
- Database queries.
- Price calculations.
- Multi-step workflows.

Example:

```ts
router.post(
  "/room-stays",
  validate(createRoomStaySchema),
  roomStayController.create,
);
```

### Validator

Validators check request shape and basic input constraints:

- Required fields.
- UUID format.
- Enum values.
- Date and date range format.
- String length.
- Number range.

Validators must not query the database or execute business operations.

### Controller

Controllers are responsible for HTTP concerns only:

1. Read route parameters, query parameters, and request body.
2. Call the appropriate service method.
3. Return the success response.
4. Pass errors to the error middleware.

Controllers must not calculate room charges, write SQL, or implement state
transitions.

### Service

Services contain the business logic and application workflows:

- Check room availability.
- Validate room stay state transitions.
- Verify that a rate belongs to a room type.
- Create a room stay and its customers in one transaction.
- Calculate room charges.
- Create the final billing snapshot.
- Mark a bill as paid.

Services may call repositories and other domain services, but should not know
about Express `Request` or `Response` objects.

### Repository

Repositories contain database access logic:

- Find records by ID.
- Find overlapping room stays.
- Find available rooms.
- Find an open work session.
- Save, update, and delete entities.
- Execute narrowly scoped database queries.

Repositories must not return HTTP responses or decide business state
transitions.

### Entity

Entities describe database structure:

- Table names.
- Columns and column types.
- Indexes.
- Foreign keys.
- Relations.
- PostgreSQL enums.

Entities must not call services, repositories, external APIs, or Express code.

## State Transition Rules

State transitions must be implemented in services, not in routers or
controllers.

Example for `RoomStay`:

```text
reserved -> checked_in
reserved -> cancelled
reserved -> no_show
checked_in -> checked_out
```

The service must reject unsupported transitions with a domain error such as
`INVALID_STAY_STATUS`.

## Transaction Rules

Use a database transaction when one operation changes multiple related tables.

Examples:

- Creating a room stay and assigning multiple customers.
- Checking in a reserved room stay.
- Finalizing a bill and storing its rate snapshot.
- Marking a bill as paid and recording the confirming employee.

If any step fails, all changes in the operation must be rolled back.

## Business Error Rules

Use stable error codes instead of relying on raw database messages.

Examples:

```text
ROOM_NOT_FOUND
ROOM_ALREADY_RESERVED
INVALID_DATE_RANGE
INVALID_STAY_STATUS
RATE_NOT_FOUND
CUSTOMER_NOT_FOUND
PRIMARY_CUSTOMER_REQUIRED
BILL_ALREADY_PAID
```

Business errors should be converted to the standard API error response by the
error middleware.

## Naming Rules

- Use singular names for services, controllers, repositories, and entities.
- Use plural names for REST collections.
- Use `create`, `list`, `getById`, `update`, and `remove` for basic operations.
- Use explicit action names for state transitions, such as `checkIn`,
  `checkOut`, `cancel`, `markPaid`, and `close`.
- Keep database column names in `snake_case`.
- Keep TypeScript property names in `camelCase`.

## API Implementation Checklist

Before submitting an API implementation, verify:

- The feature document has been read.
- The request schema validates all input.
- The controller contains no business logic.
- The service handles all business rules.
- Database access is isolated in a repository or service.
- Multi-table changes use a transaction.
- Errors use stable business error codes.
- The response does not expose sensitive data.
- The endpoint has at least one success and one failure test.
