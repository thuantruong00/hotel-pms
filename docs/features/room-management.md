# Room Management

## Room Types

Room types describe the room configuration, not a physical room.

Examples:

- Single room
- Double room
- Twin room
- VIP room

Room type data may include capacity, bed count, bed type, and active status.

## Rooms

A room belongs to exactly one room type and represents a physical room.

Room status values may include:

- `available`
- `occupied`
- `reserved`
- `cleaning`
- `maintenance`
- `out_of_order`
- `inactive`

Future reservations must be checked by date range. A manually stored room
status must not be the only source for future availability.

## Availability Rule

Two stays overlap when:

```text
existing.planned_check_in_at < requested.planned_check_out_at
AND existing.planned_check_out_at > requested.planned_check_in_at
```

Cancelled and no-show stays do not block availability.
