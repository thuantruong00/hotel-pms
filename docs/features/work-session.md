# Work Session

## Purpose

Track the employee's active working period and associate created room stays
with that period.

## Scope

A work session only contains:

- Employee
- Start time
- End time
- Status

## Rules

- A work session belongs to one user.
- A user may have only one open work session at a time.
- A room stay may reference the work session that created it.
- Work session does not own rooms or customers.
- Closing a work session must not delete its historical room stays.

## States

```text
open -> closed
```
