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
