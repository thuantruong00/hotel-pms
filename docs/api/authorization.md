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

## Roles

| Role | Who | Purpose |
|---|---|---|
| `root` | System | Initial setup only. Created on startup with `INIT=1` (`ROOT_USERNAME` / `ROOT_PASSWORD`). Used to create the owner account. |
| `super_admin` | Hotel owner | Full access, including employee accounts. |
| `admin` | Employee | Front-desk operations plus room, room type, and rate configuration. |
| `staff` | Employee | Daily front-desk operations. (Covers the "staff/user" role.) |

Employees are granted `admin` or `staff`. The owner uses `super_admin`.

### Account Management Rule

A user can only create, list, and update accounts whose role is strictly lower
than their own, and can only assign such roles:

```text
root        -> super_admin, admin, staff
super_admin -> admin, staff
admin       -> (none)
staff       -> (none)
```

`root` can never be assigned through the API. Users change their own password
through `POST /api/auth/change-password`, not through the account APIs.

## Permission Matrix

| Capability | Staff | Admin | Super admin | Root |
|---|---:|---:|---:|---:|
| View rooms and availability | Yes | Yes | Yes | Yes |
| Create reservation, check in/out | Yes | Yes | Yes | Yes |
| Manage customers | Yes | Yes | Yes | Yes |
| Confirm payment status | Yes | Yes | Yes | Yes |
| Manage rooms, room types, rates | No | Yes | Yes | Yes |
| Manage accounts | No | No | Yes | Yes |

## JSON-Based Access Configuration

Defaults are fixed in:

```text
backend/src/config/role-access.json
```

A deployment may override any role in `backend/data/roleAccess.json` (same
shape, merged per role). The file contains three maps:

- `pages`: frontend pages each role sees after login (`dashboard`, `stays`,
  `customers`, `rooms`, `accounts`, `change-password`).
- `allow`: permission codes allowed for a role (`*` = all).
- `block`: permission codes denied for a role.

Example:

```json
{
  "pages": {
    "staff": ["dashboard", "stays", "customers", "change-password"]
  },
  "allow": {
    "staff": ["rooms.read", "room-stays.write"],
    "super_admin": ["*"]
  },
  "block": {
    "staff": ["room-rates.write"]
  }
}
```

Login and `GET /api/auth/me` return the user's `pages` and effective
`permissions`. The frontend builds its menu and route guards from `pages`.

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
  requirePermission("room-stays.write"),
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

- An account can only be managed by a user with a higher role.
- A room stay must exist before it can be checked out.
- A payment confirmation must record the current employee.

## Security Rules

- Never accept `role`, `userId`, or `paidByUserId` from the client as trusted
  identity data.
- Derive the current user from the authenticated context.
- Do not log passwords, password hashes, or full identity numbers.
- Do not expose internal authorization details in error responses.
- Apply authorization checks before starting expensive business operations.
