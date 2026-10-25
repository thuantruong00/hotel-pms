# Hotel PMS Requirements Summary

## 1. Product Focus

The application is a hotel property-management system focused on helping front-desk staff create and calculate room charges whenever a guest arrives.

The first version should prioritize daily front-desk operations over revenue dashboards and analytics.

## 2. Core Operational Flow

```text
Find or create guest
    -> Select room
    -> Record check-in time
    -> Add room rate and optional products/services
    -> Record check-out time
    -> Calculate the total amount
    -> Confirm payment
    -> Save the transaction under the employee and work shift
```

Authentication and authorization are not part of the initial frontend prototype. The login screen is only a temporary navigation entry point.

## 3. Work Shifts

The shift label combines the employee name and the work shift.

Example:

```text
Employee: Nhu
Shift: Morning shift
Business date: 2026-10-20
```

Each shift should record:

- Employee in charge
- Shift name
- Start time
- End time
- Business date
- Open or closed status

## 4. Hotel Configuration

The system should support initial setup for:

- Hotel name and contact details
- Address and logo
- Currency and timezone
- Business-day rules
- Rounding rules for charges
- Check-in and check-out policies

## 5. Room Types

Example room types:

- Single room
- Double room
- Twin room
- VIP room
- Family room
- Hourly room
- Overnight room

Each room type may define:

- Capacity
- Hourly rate
- First-hour rate
- Additional-hour rate
- Overnight rate
- Daily rate
- Extra-guest surcharge
- Time-rounding rules

## 6. Rooms

Each room should contain:

- Room number or code
- Room type
- Floor
- Capacity
- Default rate
- Notes
- Operational status

Suggested room statuses:

- `Available`: ready to rent
- `Occupied`: currently used by a guest
- `Reserved`: booked for a future stay
- `Cleaning`: waiting for housekeeping
- `Maintenance`: being repaired
- `OutOfOrder`: unavailable because of a problem
- `Inactive`: no longer operated

The `Occupied` status should be derived from an active stay whenever possible, instead of being manually edited by staff.

## 7. Products and Services

The system should support products and additional services such as:

- Bottled water
- Soft drinks
- Beer
- Coffee
- Instant noodles
- Snacks
- Cold towels
- Laundry
- Transportation
- Extra-person charges

Each item should contain:

- Product or service code
- Name
- Category
- Unit of measure
- Selling price
- Cost price, if inventory tracking is needed
- Stock quantity, if inventory tracking is needed
- Tax setting, if applicable
- Active or inactive status

Suggested categories:

- Drinks
- Food
- Services
- Surcharges
- Room supplies

## 8. Room Stay Transactions

Each room-stay transaction should record:

- Transaction ID
- Room
- Guest
- Employee
- Work shift
- Check-in time
- Check-out time
- Number of guests
- Applied room rate
- Room charge
- Product and service charges
- Discount
- Surcharge
- Total amount
- Payment status
- Notes

Suggested transaction statuses:

- `Active`
- `PendingPayment`
- `Paid`
- `Cancelled`

## 9. Room-Charge Rules

The system should support configurable rules for:

- Hourly or daily billing
- First-hour pricing
- Additional-hour pricing
- Grace period
- Rounding to 15 minutes, 30 minutes, or one hour
- Daytime rates
- Nighttime rates
- Weekend and holiday rates
- Early check-in surcharge
- Late check-out surcharge

## 10. Customers

Customer creation should be lightweight. Staff should not be forced to fill in every field before creating a stay.

Minimum customer information may include:

- Internal customer ID
- Full name
- Phone number, if provided
- Nationality, with a default value where appropriate
- Notes

Additional information can be completed later.

Customer features should include:

- Create a customer quickly
- Search by name, phone number, or identity number
- Select an existing customer during check-in
- View stay history
- View total spending and number of stays
- Update customer information
- Mark frequent or VIP customers
- Record special requirements

## 11. Citizen Identity Module

Citizen identity information should be managed separately from the customer record because an identity number may change over time.

The customer record must use an immutable internal key:

```text
customer_id
```

The identity record should contain:

- Identity record ID
- Customer ID
- Identity type
- Identity number
- Name shown on the document
- Date of birth
- Gender, if available
- Nationality
- Issue date
- Expiry date
- Active or replaced status
- Replacement relationship
- Created timestamp

Identity lookup should use a composite external key:

```text
identity_type + identity_number
```

Rules:

- `customer_id` must never change.
- The identity key must be unique.
- Do not overwrite an old identity record.
- Create a new identity record when the government-issued number changes.
- Link old and new identity records to the same customer.
- Keep the identity number used at the time of each historical stay.
- Only one identity record should be active for a customer at a time.

Example:

```text
Customer: Nguyen Van A
customer_id: CUS-000001

Old identity: 012345678901
status: Replaced

Current identity: 079999999999
status: Active
```

Identity data should be protected with appropriate access control and should not be displayed in full where it is not required.

## 12. Payments

Supported payment methods may include:

- Cash
- Bank transfer
- Card
- E-wallet

Payment data should include:

- Amount received
- Change returned
- Payment method
- Payment timestamp
- Employee who confirmed payment
- Payment note

## 13. Reservations

If advance booking is supported, a reservation should contain:

- Customer
- Phone number
- Room or room type
- Expected check-in time
- Expected check-out time
- Number of guests
- Deposit
- Reservation status

Suggested reservation statuses:

- `Reserved`
- `CheckedIn`
- `Cancelled`
- `NoShow`

## 14. Frontend Direction

The frontend is planned as a Vue 3 + Vite + TypeScript application using:

- Vue Router
- Pinia
- Axios
- Naive UI

The initial interface should focus on:

- Room availability and current room status
- Quick room-stay creation
- Guest lookup and quick customer creation
- Check-in and check-out time entry
- Automatic room-charge calculation
- Product and service selection
- Payment confirmation

Revenue dashboards and advanced analytics are secondary features.

## 15. Initial Master Data

The minimum setup data required before daily operation is:

1. Hotel information
2. Room types
3. Rooms
4. Room pricing rules
5. Products and services
6. Employees
7. Work shifts
8. Payment methods
9. Customer identity settings

