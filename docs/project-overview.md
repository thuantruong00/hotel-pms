# Hotel PMS Project Overview

## Purpose

Hotel PMS supports front-desk operations for room reservations, guest stays,
room pricing, billing summaries, payment status, and employee work sessions.

## Current Scope

- Customer and identity management
- Room type and room management
- Room rate management by room type
- Advance room reservations
- Room stay lifecycle management
- Multiple customers in one room stay
- One summary bill per room stay
- Payment status and payment method tracking
- Work session management

## Out of Scope

- Product management
- Service management
- Inventory management
- Payment gateway integration
- Revenue and analytics dashboards
- IoT relationships and device management

## Core Terminology

- `User`: an employee who operates the system.
- `Customer`: a hotel guest.
- `RoomType`: a category of rooms based on capacity and bed configuration.
- `Room`: a physical hotel room.
- `RoomStay`: one reservation or actual stay for one room.
- `RoomStayCustomer`: a customer assigned to a room stay.
- `RoomStayCharge`: the summary bill for one room stay.
- `WorkSession`: the employee's active work period.

## Domain Relationships

```text
RoomType 1 ─── N Room
Room 1 ─── N RoomStay
RoomStay 1 ─── N RoomStayCustomer
Customer 1 ─── N RoomStayCustomer
RoomStay 1 ─── 1 RoomStayCharge
User 1 ─── N WorkSession
WorkSession 1 ─── N RoomStay
```
