# Billing and Payment Status

## Purpose

Calculate and store one summary bill for each room stay. Detailed payment
processing and payment gateway integration are out of scope.

## RoomStayCharge

There is at most one `RoomStayCharge` for one `RoomStay`.

The charge stores:

- Total amount
- JSONB rate snapshot
- Paid or unpaid state
- Payment method
- Payment timestamp
- Employee who confirmed payment

## Payment Rules

- Default payment method is `cash`.
- The front desk may mark a bill as paid with one checkbox.
- The amount is calculated by the backend and is read-only in the UI.
- Supported initial payment methods are `cash` and `bank_transfer`.
- The final rate snapshot must be stored on `RoomStayCharge`, not `RoomRate`.
- A rate snapshot must not be overwritten after the bill is finalized.

## Calculation

```text
total_amount = room_amount
             - discount_amount
             + surcharge_amount
             + penalty_amount
```

## Room Rate Pricing

Each `RoomRatePlan` belongs to one room type and defines a `pricing_type`:

- `hourly`: `base_price` covers the first `base_duration_minutes` (default 60).
  Extra time beyond `check_out_grace_minutes` is rounded up to
  `rounding_minutes` and billed at `additional_hour_price` per hour.
- `overnight`: same formula, with a longer base block (default 720 minutes).
- `daily`: `base_price` per started 24-hour day after
  `check_out_grace_minutes`, minimum one day.

The billing period uses actual check-in/check-out times when available,
otherwise the planned times.
