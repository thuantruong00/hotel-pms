# Work Session (removed)

The open/close shift flow has been removed. Employees only need to sign in to
operate; there is no "start shift" or "end shift" button.

- Room stay operations do not require or reference a work session.
- Each room stay records the employee who created it (`created_by_user_id`).
- Billing payment records the confirming employee (`paid_by_user_id`).

The legacy `work_sessions` table and the `room_stays.session_id` column are kept
so historical data is not lost. They can be dropped later with an explicit
migration once the data is no longer needed.
