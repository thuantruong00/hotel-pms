# API Contracts

## Customer APIs

```text
POST  /api/customers
GET   /api/customers
GET   /api/customers/:customerId
PATCH /api/customers/:customerId
POST  /api/customers/:customerId/identities
```

## Room APIs

```text
GET   /api/room-types
POST  /api/room-types
PATCH /api/room-types/:roomTypeId
GET   /api/rooms
POST  /api/rooms
PATCH /api/rooms/:roomId
GET   /api/rooms/availability
```

## Room Stay APIs

```text
POST /api/room-stays
GET  /api/room-stays/:stayId
POST /api/room-stays/:stayId/check-in
POST /api/room-stays/:stayId/check-out
POST /api/room-stays/:stayId/cancel
POST /api/room-stays/:stayId/no-show
POST /api/room-stays/:stayId/customers
```

## Billing APIs

```text
GET  /api/room-stays/:stayId/bill
POST /api/room-stays/:stayId/bill/finalize
POST /api/room-stays/:stayId/bill/mark-paid
```

## Work Session APIs

```text
POST /api/work-sessions/open
GET  /api/work-sessions/current
POST /api/work-sessions/:sessionId/close
GET  /api/work-sessions/:sessionId/room-stays
```

## Create RoomStay Contract

### Request

```json
{
  "roomId": "uuid",
  "roomRateId": "uuid",
  "plannedCheckInAt": "2026-11-05T14:00:00+07:00",
  "plannedCheckOutAt": "2026-11-07T12:00:00+07:00",
  "customers": [
    {
      "customerId": "uuid",
      "isPrimary": true
    }
  ],
  "sessionId": "uuid"
}
```

### Validation

- The room must exist and be active.
- The rate must belong to the room type.
- Check-out must be later than check-in.
- The room must have no overlapping active stay.
- At least one customer is required.
- Exactly one primary customer is recommended for the initial workflow.

### Success

```json
{
  "data": {
    "stayId": "uuid",
    "status": "reserved"
  },
  "message": "Room stay created successfully"
}
```

### Business Errors

```text
ROOM_NOT_FOUND
ROOM_INACTIVE
ROOM_ALREADY_RESERVED
INVALID_DATE_RANGE
RATE_NOT_FOUND
RATE_NOT_BELONG_TO_ROOM_TYPE
CUSTOMER_NOT_FOUND
PRIMARY_CUSTOMER_REQUIRED
```

## Supporting APIs

Endpoints required to operate the contracts above. All responses use the
standard `{ data, message }` / `{ error: { code, message } }` format.

```text
POST  /api/auth/login                    # { username, password } -> { accessToken, tokenType, user }
GET   /api/auth/me
GET   /api/users                         # users.manage (admin)
POST  /api/users                         # users.manage (admin)
PATCH /api/users/:userId                 # users.manage (admin)
GET   /api/rooms/:roomId
GET   /api/room-types/:roomTypeId/rates
POST  /api/room-types/:roomTypeId/rates  # room-rates.write
GET   /api/room-rates/:rateId
PATCH /api/room-rates/:rateId            # room-rates.write
GET   /api/room-stays                    # filters: status, roomId, customerId, from, to, page, limit
```

Protected endpoints require `Authorization: Bearer <accessToken>`. The user,
role, and status are reloaded from the database on every request.

### Availability Query

```text
GET /api/rooms/availability?checkInAt=<ISO datetime>&checkOutAt=<ISO datetime>&roomTypeId=<uuid>&guestCount=<n>
```

Returns active rooms with no overlapping `reserved` or `checked_in` stay.

### Billing Flow

```text
check-out  -> room amount is calculated and stored on the stay
finalize   -> RoomStayCharge is created with an immutable rate snapshot
mark-paid  -> is_paid, payment_method, paid_at, paid_by_user_id are recorded
```

`finalize` accepts optional `discountAmount`, `surchargeAmount`,
`penaltyAmount`, `penaltyReason`, and `paymentMethod`. The total is always
calculated by the backend.

### Additional Business Errors

```text
CUSTOMER_REQUIRED, DUPLICATE_CUSTOMER, MULTIPLE_PRIMARY_CUSTOMERS,
CUSTOMER_ALREADY_IN_STAY, ROOM_STAY_NOT_FOUND, ROOM_OCCUPIED,
ROOM_TYPE_NOT_FOUND, ROOM_TYPE_CODE_EXISTS, ROOM_NUMBER_EXISTS, RATE_CODE_EXISTS,
IDENTITY_ALREADY_EXISTS, IDENTITY_NOT_FOUND, IDENTITY_ALREADY_REPLACED,
BILL_ALREADY_FINALIZED, BILL_NOT_FINALIZED, INVALID_BILL_AMOUNT,
WORK_SESSION_NOT_FOUND, WORK_SESSION_ALREADY_OPEN, WORK_SESSION_ALREADY_CLOSED,
WORK_SESSION_NOT_OPEN, WORK_SESSION_NOT_OWNED,
INVALID_CREDENTIALS, INVALID_TOKEN, ACCOUNT_LOCKED, ACCOUNT_INACTIVE,
VALIDATION_ERROR, MALFORMED_REQUEST
```
