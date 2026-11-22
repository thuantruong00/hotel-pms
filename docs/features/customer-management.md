# Customer Management

## Purpose

Allow front-desk staff to create lightweight customer records and manage the
identity documents provided by guests.

## Business Rules

- Customer creation must not require every optional field.
- `customer_id` is an immutable internal identifier.
- One customer can have multiple identity records.
- Identity uniqueness is based on `identity_type` and `identity_number`.
- Nationality belongs to the identity record, not the customer record.
- Old identity records must not be overwritten when a document changes.
- A customer may be linked to many room stays.

## Customer Stay Relationship

The `room_stay_customers` table links customers to room stays and contains:

- `stay_id`
- `customer_id`
- `is_primary`

One room stay may contain multiple customers. The primary customer is used as
the main contact for the stay.

## Search

Customers can be searched by name, phone number, or identity (CCCD) number
(`GET /api/customers?search=...&searchBy=all|name|phone|identity`). Searching by
the identity number lets the front desk reuse a returning guest's record
instead of re-entering their details.

## Creating Customers While Booking

The booking form includes an inline sub-form to create a new customer without
leaving the reservation. The value typed in the search box (for example the
CCCD number) is prefilled into the sub-form. If the identity number already
belongs to a customer, that customer is selected instead of creating a
duplicate.
