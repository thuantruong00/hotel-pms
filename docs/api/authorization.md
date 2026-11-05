# Authentication and Authorization

## Authentication vs Authorization

- Authentication answers: "Who is the user?"
- Authorization answers: "What is the user allowed to do?"

Authentication must happen before authorization.

```text
Request
  -> Authenticate user
  -> Check user status
  -> Check role or permission
  -> Execute controller
```

## User Requirements

Only users with an active status may access protected APIs.

Blocked or inactive users must be rejected even when they provide a valid
session or token.

The server must load the user's role from the server-side session or database.
The client must not be trusted to provide its own role.

## Initial Roles

The initial role model is:

- `staff`: daily front-desk operations.
- `manager`: staff operations plus configuration and oversight.
- `admin`: system administration and full access.

The existing backend contains legacy role names such as `guest`, `user`, and
`root` in older middleware. These names must not be used in new APIs. They must
be mapped or removed when authorization is implemented.

## Initial Permission Matrix

| Capability | Staff | Manager | Admin |
|---|---:|---:|---:|
| View rooms | Yes | Yes | Yes |
| View room availability | Yes | Yes | Yes |
| Create reservation | Yes | Yes | Yes |
| Check in and check out | Yes | Yes | Yes |
| Manage customers | Yes | Yes | Yes |
| Confirm payment status | Yes | Yes | Yes |
| Manage room types | No | Yes | Yes |
| Manage room rates | No | Yes | Yes |
| Manage users | No | No | Yes |
| Change system configuration | No | No | Yes |

This matrix is the initial proposal and must be updated when business roles
are formally approved.

## JSON-Based Access Configuration

Access configuration is stored in:

```text
backend/data/roleAccess.json
```

The file contains two maps:

- `allow`: permissions explicitly allowed for a role.
- `block`: permissions explicitly denied for a role.

Example:

```json
{
  "allow": {
    "staff": ["rooms.read", "room-stays.write"],
    "admin": ["*"]
  },
  "block": {
    "staff": ["room-rates.write"]
  }
}
```

Block rules take precedence over allow rules. Permission codes must be stable,
lowercase, and use dot notation. Do not use display labels as permission codes.

The JSON file is only a configuration source. The backend middleware must
enforce the decision for every protected endpoint. Frontend menu visibility is
not a security mechanism.

## Middleware Rules

Authorization middleware belongs on protected routes or route groups.

Example:

```ts
router.post(
  "/room-stays/:stayId/check-in",
  requireAuthentication,
  requireRoles("staff", "manager", "admin"),
  roomStayController.checkIn,
);
```

Do not implement authorization checks only in the frontend. The backend must
enforce every protected operation.

## HTTP Responses

Return `401 Unauthorized` when the request has no valid authenticated user.

Return `403 Forbidden` when the user is authenticated but lacks permission.

Example:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this operation"
  }
}
```

## Resource Ownership

Role checks alone are not enough for sensitive operations. When needed, the
service must also verify resource ownership or operational scope.

Examples:

- A work session must belong to the current employee before it is closed.
- A room stay must exist before it can be checked out.
- A payment confirmation must record the current employee.

## Security Rules

- Never accept `role`, `userId`, or `paidByUserId` from the client as trusted
  identity data.
- Derive the current user from the authenticated context.
- Do not log passwords, password hashes, or full identity numbers.
- Do not expose internal authorization details in error responses.
- Apply authorization checks before starting expensive business operations.
