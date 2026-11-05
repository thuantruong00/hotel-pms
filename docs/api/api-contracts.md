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
