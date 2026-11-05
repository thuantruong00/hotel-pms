# Reservation and Room Stay

## Purpose

Use one `RoomStay` record throughout the reservation and accommodation
lifecycle. Do not create a separate reservation record for the current scope.

## RoomStay States

```text
reserved
checked_in
checked_out
cancelled
no_show
```

Allowed transitions:

```text
reserved -> checked_in
reserved -> cancelled
reserved -> no_show
checked_in -> checked_out
```

## Time Fields

- `planned_check_in_at`: expected arrival time.
- `planned_check_out_at`: expected departure time.
- `actual_check_in_at`: actual arrival time.
- `actual_check_out_at`: actual departure time.

## Reservation Rules

- One room cannot have overlapping active stays.
- A stay must contain a room.
- A stay must contain at least one customer.
- A stay may contain multiple customers.
- A primary customer is identified through `room_stay_customers.is_primary`.
- A reservation uses status `reserved` before arrival.
- Billing is calculated against the room stay, not individual customers.
