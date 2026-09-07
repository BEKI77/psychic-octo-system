# Cylinder Inventory Management System
## Complete Technical System Design

**Version:** 1.0  
**Date:** September 2026  
**Recommended Stack:** Next.js, NestJS, Drizzle ORM, PostgreSQL, Better Auth, Docker

---

## 1. System Overview

The Cylinder Inventory Management System manages the complete lifecycle of physical cylinders:

```text
Supplier
   |
   v
Receiving
   |
   v
Cylinder Registration
   |
   v
Warehouse Inventory
   |
   +----------------+
   |                |
   v                v
Available       Maintenance
   |                |
   v                v
Customer Issue   Repair
   |                |
   v                |
Customer -------- Return
   |                |
   +-- Credit ------+
       Payment      |
                    v
               Inspection
                    |
           +--------+--------+
           |        |        |
           v        v        v
       Available  Repair   Scrapped
```

The platform has three core domains:

```text
+------------------------------------------------+
|              CYLINDER PLATFORM                |
+----------------+----------------+--------------+
| Physical       | Customer       | Financial    |
| Inventory      | Management     | Ledger       |
|                |                |              |
| Cylinders      | Customers      | Invoices     |
| Locations      | Issues         | Payments     |
| Movements      | Returns        | Credit       |
| Conditions     | Balances       | Statements   |
+----------------+----------------+--------------+
```

### Core principle

The system must be able to answer at any time:

- Which cylinder is where?
- What condition is it in?
- Who currently has it?
- When was it issued?
- When was it returned?
- How much did the customer pay?
- How much does the customer owe?
- What is the complete history of the cylinder?

---

# 2. Architectural Principles

## 2.1 Individually identifiable cylinders

Every physical cylinder should have a unique identity.

```text
Cylinder ID
Serial Number
QR Code
Barcode
Cylinder Type
Capacity
Brand
Current Location
Current Customer
Availability Status
Condition
```

QR/barcode scanning should be supported from the beginning of the data model even if physical scanning is introduced later.

## 2.2 Current state + immutable history

The `cylinders` table stores the current state.

The `inventory_transactions` table stores historical movements.

Never delete historical inventory transactions.

## 2.3 Ledger-based financial accounting

Do not maintain the customer balance only as a mutable number.

Instead record financial events:

```text
Invoice       +15,000 ETB
Payment        -8,000 ETB
Return         -3,000 ETB
-------------------------
Balance         4,000 ETB
```

## 2.4 Physical and financial operations are related but separate

A cylinder return and a financial refund are separate concepts.

```text
Physical Return != Financial Refund
```

They can be linked through transaction references.

## 2.5 Backend is authoritative

All important business rules must be enforced by the backend.

The frontend should never be trusted to enforce:

- Credit limits
- Cylinder availability
- Return ownership
- Payment validity
- User permissions
- Inventory state transitions

---

# 3. Recommended Technology Stack

## Backend

```text
Node.js
NestJS
TypeScript
Drizzle ORM
PostgreSQL
Better Auth
Zod
```

### Backend decisions

- **NestJS** is the primary backend framework and provides the module, controller, service, guard, interceptor, and dependency-injection structure.
- **Drizzle ORM** is the database access and schema layer. PostgreSQL remains the authoritative source of truth.
- **Better Auth** is responsible for authentication, sessions, account management, and authentication-related persistence. It should be integrated behind a dedicated NestJS authentication module.
- **Zod** is used for request/input validation at API boundaries where schema validation is required.
- **Redis (deferred) is intentionally not part of the initial architecture.** Do not introduce Redis (deferred) merely for caching until a measured performance requirement exists.
- Background processing can initially use simple database-backed/application-level mechanisms. A queue such as BullMQ (deferred) + Redis (deferred) can be introduced later when notification volume, scheduled jobs, or asynchronous workloads justify it.

### Authentication boundary

```text
Next.js Frontend
       |
       | authenticated request
       v
NestJS API
       |
       +---- Better Auth
       |         |
       |         +-- sessions
       |         +-- accounts
       |         +-- users
       |
       +---- RBAC / Authorization
       |
       v
    Drizzle ORM
       |
       v
 PostgreSQL
```

Better Auth handles **identity and sessions**; NestJS guards/services handle **application authorization and business permissions**. Do not duplicate password/session logic inside the application's domain modules.

## Frontend

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
```

## Infrastructure

```text
Docker
Docker Compose
Traefik or Nginx
PostgreSQL
Object Storage
```

Redis (deferred) is deliberately omitted from the initial deployment. It can be added later as an infrastructure dependency when caching, queues, rate limiting at scale, or distributed background workers require it.

## Optional integrations

```text
Telegram Bot
SMS Provider
Email
QR Code
Barcode Scanner
RFID
```

---

## 3.1 Architecture Decisions and Trade-offs

### Why NestJS

NestJS is preferred for this system because the platform has many related business domains with strict workflows: inventory, customer holdings, sales, payments, returns, maintenance, and auditability. NestJS modules, dependency injection, guards, interceptors, and exception handling provide a strong structure for keeping these domains isolated while allowing them to participate in database transactions.

### Why Drizzle ORM

Drizzle is preferred over a heavier data-mapper approach because this system benefits from explicit PostgreSQL schemas, typed SQL-style queries, predictable joins, and direct control over transactions and indexes. The database schema should remain easy to inspect and optimize.

### Why Better Auth

Authentication is a cross-cutting concern and should not be custom-built inside the cylinder domain. Better Auth provides the identity/session foundation while NestJS remains responsible for authorization, RBAC, and business rules.

### Why no Redis (deferred) initially

Redis (deferred) should not be introduced just because it is common in scalable architectures. PostgreSQL is already the system of record, and the MVP can operate without a cache or distributed queue. Removing Redis (deferred) initially reduces infrastructure complexity, operational overhead, deployment dependencies, and failure modes.

Redis (deferred) should be reconsidered when there is evidence of: high read contention, expensive repeated queries, distributed background jobs, high-volume notifications, rate limiting requirements that exceed the application's current approach, or real-time workloads requiring a shared ephemeral store.


---

# 4. High-Level Architecture

```text
                         INTERNET
                            |
                            v
                    +---------------+
                    |  Cloudflare   |
                    +-------+-------+
                            |
                            v
                    +---------------+
                    | Reverse Proxy |
                    | Traefik/Nginx |
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
              v                           v
       +--------------+            +--------------+
       |   Next.js    |            |   NestJS API |
       |   Frontend   |            |   Backend    |
       +--------------+            +------+-------+
                                         |
                           +-------------+-------------+
                           |             |             |
                           v             v             v
                    +-------------+ +-------------+ +-------------+
                    | Better Auth | |  PostgreSQL | | Object      |
                    |             | | + Drizzle  | | Storage     |
                    +-------------+ +-------------+ +-------------+

                    Initial deployment has no Redis (deferred)/cache layer.
```

---

# 5. Core Modules

```text
Authentication
Users
Roles
Permissions

Dashboard

Cylinder Management
Cylinder Types
Cylinder Conditions
Cylinder Status

Warehouse Management
Warehouse Locations
Stock
Inventory Movements

Receiving
Suppliers
Receiving Documents

Customers
Customer Accounts
Customer Cylinder Holdings

Issuing
Sales
Sale Items

Returns
Return Items
Return Inspection

Payments
Customer Ledger
Credit Management

Maintenance
Repair
Damage
Scrapping

Reports
Analytics

Notifications

Audit Logs
System Settings
```

---

# 6. Database Design

PostgreSQL should be the primary source of truth.

---

## 6.1 Users

```sql
users
-----
id UUID PK
username
email
password_hash
first_name
last_name
phone
is_active
created_at
updated_at
```

---

## 6.2 Roles

```sql
roles
-----
id UUID PK
name
description
```

Recommended roles:

```text
ADMIN
MANAGER
WAREHOUSE_MANAGER
WAREHOUSE_WORKER
ACCOUNTANT
VIEWER
```

---

## 6.3 Permissions

```sql
permissions
-----------
id UUID PK
code
description
```

Examples:

```text
CYLINDER_CREATE
CYLINDER_UPDATE
CYLINDER_VIEW

INVENTORY_RECEIVE
INVENTORY_ISSUE
INVENTORY_RETURN
INVENTORY_TRANSFER
INVENTORY_ADJUST

CUSTOMER_CREATE
CUSTOMER_UPDATE

PAYMENT_CREATE
PAYMENT_VOID

CREDIT_APPROVE

REPORT_VIEW

USER_MANAGE
```

Use RBAC rather than hard-coding role checks throughout the application.

---

# 7. Warehouse Management

## 7.1 Warehouses

```sql
warehouses
----------
id UUID PK
code
name
address
phone
is_active
created_at
updated_at
```

Example:

```text
WH-001
Main Warehouse
Addis Ababa
```

## 7.2 Warehouse Locations

```sql
warehouse_locations
-------------------
id UUID PK
warehouse_id FK
parent_id FK NULL
code
name
location_type
is_active
created_at
```

Location types:

```text
ZONE
RACK
AREA
REPAIR
INSPECTION
DISPATCH
SCRAP
```

Example:

```text
WH-001
 |
 +-- Z-A
 |    +-- R-A1
 |    +-- R-A2
 |    +-- R-A3
 |
 +-- Z-B
 |
 +-- REPAIR
 +-- INSPECTION
 +-- SCRAP
```

---

# 8. Cylinder Types

```sql
cylinder_types
--------------
id UUID PK
code
name
capacity_kg
brand
description
deposit_amount
default_price
is_active
created_at
updated_at
```

Examples:

```text
LPG-06   6 KG LPG Cylinder
LPG-12   12 KG LPG Cylinder
LPG-15   15 KG LPG Cylinder
LPG-25   25 KG LPG Cylinder
LPG-50   50 KG LPG Cylinder
```

This allows new cylinder sizes/types without redesigning the database.

---

# 9. Cylinders

This is one of the most important tables.

```sql
cylinders
---------
id UUID PK
cylinder_type_id FK

internal_code UNIQUE
serial_number UNIQUE
qr_code UNIQUE
barcode UNIQUE

manufacture_date
purchase_date

availability_status
condition_status

current_warehouse_id FK
current_location_id FK
current_customer_id FK NULL

last_inspection_at
next_inspection_at

created_at
updated_at
```

## Current availability

```text
AVAILABLE
RESERVED
WITH_CUSTOMER
IN_TRANSIT
BLOCKED
SCRAPPED
```

## Condition

```text
GOOD
DAMAGED
NEEDS_INSPECTION
UNDER_REPAIR
REPAIRED
SCRAPPED
```

Do not combine availability and condition into one huge status enum.

For example:

```text
availability = AVAILABLE
condition = UNDER_REPAIR
```

can represent a cylinder that physically exists but cannot be issued.

---

# 10. Suppliers

```sql
suppliers
---------
id UUID PK
code
name
phone
email
address
tax_number
contact_person
is_active
created_at
updated_at
```

---

# 11. Receiving

```sql
receipts
--------
id UUID PK
receipt_number UNIQUE
supplier_id FK
warehouse_id FK

supplier_reference
received_date

status
notes

created_by FK
approved_by FK NULL

created_at
updated_at
```

Statuses:

```text
DRAFT
PENDING_APPROVAL
RECEIVED
CANCELLED
```

## Receipt items

```sql
receipt_items
-------------
id UUID PK
receipt_id FK
cylinder_id FK
condition_status
notes
```

Every physical cylinder should be registered individually.

---

# 12. Inventory Transactions

This is the heart of physical inventory tracking.

```sql
inventory_transactions
----------------------
id UUID PK
transaction_number UNIQUE

cylinder_id FK

transaction_type

from_warehouse_id FK NULL
from_location_id FK NULL
from_customer_id FK NULL

to_warehouse_id FK NULL
to_location_id FK NULL
to_customer_id FK NULL

reference_type
reference_id

condition_before
condition_after

performed_by FK
transaction_date

notes
created_at
```

Transaction types:

```text
RECEIVE
ISSUE
RETURN
TRANSFER
MOVE
INSPECTION
REPAIR_START
REPAIR_COMPLETE
DAMAGE
SCRAP
ADJUSTMENT
```

Example lifecycle:

```text
CYL-001245
    |
    +-- RECEIVE
    |      Supplier -> Warehouse
    |
    +-- ISSUE
    |      Warehouse -> Customer
    |
    +-- RETURN
    |      Customer -> Inspection
    |
    +-- REPAIR_START
    |      Inspection -> Repair
    |
    +-- REPAIR_COMPLETE
           Repair -> Warehouse
```

---

# 13. Customers

```sql
customers
---------
id UUID PK

customer_code UNIQUE

name
customer_type

phone
email
address

tax_number

credit_limit
credit_enabled

status

created_at
updated_at
```

Customer types:

```text
INDIVIDUAL
BUSINESS
WHOLESALE
DISTRIBUTOR
RETAIL
```

---

# 14. Customer Cylinder Holdings

Current ownership/holding can be represented by:

```text
cylinders.current_customer_id
```

Historical ownership comes from:

```text
inventory_transactions
```

Therefore:

```text
Current state:
cylinders

Historical state:
inventory_transactions
```

---

# 15. Sales / Cylinder Issues

A cylinder issue should create a sales/issue transaction.

```sql
sales
-----
id UUID PK

sale_number UNIQUE

customer_id FK
warehouse_id FK

sale_date

subtotal
discount
tax
total

paid_amount
outstanding_amount

payment_status

status

created_by FK
approved_by FK NULL

created_at
updated_at
```

Statuses:

```text
DRAFT
CONFIRMED
CANCELLED
```

Payment statuses:

```text
UNPAID
PARTIALLY_PAID
PAID
OVERPAID
```

## Sale items

```sql
sale_items
----------
id UUID PK
sale_id FK
cylinder_id FK

unit_price
discount
subtotal
```

---

# 16. Example Cylinder Issue

Customer:

```text
Abebe Trading
```

takes:

```text
10 x 12 KG cylinders
```

At:

```text
1,500 ETB each
```

Financial result:

```text
Subtotal:       15,000 ETB
Paid:             8,000 ETB
Outstanding:      7,000 ETB

Payment Status:
PARTIALLY_PAID
```

Physical result:

```text
10 cylinders:
WAREHOUSE -> CUSTOMER
```

---

# 17. Payments

```sql
payments
--------
id UUID PK

payment_number UNIQUE

customer_id FK

amount
payment_method

payment_date

reference_number
notes

status

received_by FK

created_at
```

Payment methods:

```text
CASH
BANK_TRANSFER
MOBILE_MONEY
CARD
OTHER
```

---

# 18. Payment Allocation

One payment can be allocated against multiple outstanding sales.

```sql
payment_allocations
-------------------
id UUID PK

payment_id FK
sale_id FK

allocated_amount

created_at
```

Example:

```text
Customer pays 20,000 ETB

Invoice A -> 8,000
Invoice B -> 7,000
Invoice C -> 5,000
```

---

# 19. Customer Ledger

```sql
customer_ledger
---------------
id UUID PK

customer_id FK

transaction_type

reference_type
reference_id

debit
credit

balance

transaction_date

created_by FK
```

Transaction types:

```text
SALE
PAYMENT
RETURN
REFUND
ADJUSTMENT
CREDIT_NOTE
DEBIT_NOTE
```

Example:

```text
Date       Description       Debit     Credit    Balance
----------------------------------------------------------
05 Sep     Cylinder Issue    15,000       -      15,000
05 Sep     Cash Payment           -     8,000       7,000
08 Sep     Cylinder Issue    12,000       -      19,000
08 Sep     Payment               -     5,000      14,000
10 Sep     Return             6,000       -        8,000
```

---

# 20. Returns

Returns must support both full and partial returns.

```sql
returns
-------
id UUID PK

return_number UNIQUE

customer_id FK
warehouse_id FK

return_date

status

total_items

notes

received_by FK
approved_by FK NULL

created_at
updated_at
```

Statuses:

```text
DRAFT
RECEIVED
INSPECTED
COMPLETED
CANCELLED
```

## Return items

```sql
return_items
------------
id UUID PK

return_id FK
sale_item_id FK
cylinder_id FK

condition_at_return

inspection_result

financial_adjustment

notes
```

---

# 21. Partial Return Example

Original issue:

```text
10 cylinders
15,000 ETB
```

Customer returns:

```text
4 cylinders
```

System shows:

```text
Original quantity:    10
Returned quantity:     4
Remaining quantity:    6
```

The four physical cylinders move back through the inspection process.

Financial adjustment is calculated separately according to company rules.

---

# 22. Return Inspection

When cylinders are returned:

```text
CYL-001 -> GOOD
CYL-002 -> GOOD
CYL-003 -> DAMAGED
CYL-004 -> NEEDS_REPAIR
```

Movement:

```text
Customer
   |
   v
Inspection
```

Then:

```text
GOOD
 |
 v
Warehouse

DAMAGED
 |
 v
Damage/Inspection Area

NEEDS_REPAIR
 |
 v
Repair Area
```

---

# 23. Maintenance

```sql
maintenance_records
-------------------
id UUID PK

maintenance_number UNIQUE

cylinder_id FK

maintenance_type
description

reported_at
started_at
completed_at

cost

status

performed_by
approved_by

created_at
updated_at
```

Statuses:

```text
REPORTED
IN_REPAIR
COMPLETED
CANCELLED
```

---

# 24. Scrapping

Never delete a cylinder that has reached end-of-life.

Record:

```text
reason
date
approved_by
scrap_value
notes
```

The cylinder becomes:

```text
availability = SCRAPPED
condition = SCRAPPED
```

A scrapped cylinder must never be issuable.

---

# 25. Cylinder State Machine

```text
                    +-------------+
                    |  AVAILABLE  |
                    +------+------+
                           |
                         ISSUE
                           |
                           v
                    +-------------+
                    |WITH_CUSTOMER|
                    +------+------+
                           |
                         RETURN
                           |
                           v
                 +-------------------+
                 | NEEDS_INSPECTION  |
                 +---------+---------+
                           |
              +------------+------------+
              |            |            |
              v            v            v
            GOOD        DAMAGED      REPAIR
              |            |            |
              v            v            v
         AVAILABLE       SCRAP        REPAIR
                                         |
                                         v
                                    AVAILABLE
```

Invalid transitions must be rejected.

Example:

```text
SCRAPPED -> ISSUE
```

must never be allowed.

---

# 26. API Architecture

Use REST initially.

Base URL:

```text
/api/v1
```

## Authentication

```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

## Users

```http
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

---

# 27. Cylinder API

```http
GET    /cylinders
POST   /cylinders
GET    /cylinders/:id
PATCH  /cylinders/:id

GET /cylinders/:id/history
GET /cylinders/:id/movements

GET /cylinders/by-qr/:code
GET /cylinders/by-barcode/:code
```

Filters:

```text
status
condition
type
warehouse
location
customer
serial_number
```

---

# 28. Receiving API

```http
GET  /receipts
POST /receipts

GET  /receipts/:id
PATCH /receipts/:id

POST /receipts/:id/confirm
POST /receipts/:id/cancel
```

---

# 29. Customer API

```http
GET    /customers
POST   /customers
GET    /customers/:id
PATCH  /customers/:id

GET /customers/:id/cylinders
GET /customers/:id/transactions
GET /customers/:id/ledger
GET /customers/:id/statement
GET /customers/:id/credit
```

---

# 30. Issue / Sales API

```http
GET  /sales
POST /sales

GET /sales/:id

POST /sales/:id/confirm
POST /sales/:id/cancel

GET /sales/:id/items
```

---

# 31. Returns API

```http
GET  /returns
POST /returns

GET /returns/:id

POST /returns/:id/inspect
POST /returns/:id/complete
POST /returns/:id/cancel
```

---

# 32. Payment API

```http
GET  /payments
POST /payments

GET /payments/:id

POST /payments/:id/allocate
POST /payments/:id/void
```

---

# 33. Inventory API

```http
GET /inventory/summary

GET /inventory/stock
GET /inventory/movements

POST /inventory/transfer
POST /inventory/adjustment
```

---

# 34. Reports API

```http
GET /reports/inventory
GET /reports/cylinder-accountability
GET /reports/customer-balances
GET /reports/credit-aging
GET /reports/sales
GET /reports/payments
GET /reports/returns
GET /reports/damaged
GET /reports/maintenance
```

---

# 35. Frontend Structure

Recommended Next.js structure:

```text
app/
|
+-- login/
|
+-- dashboard/
|
+-- inventory/
|   +-- cylinders/
|   +-- receiving/
|   +-- movements/
|   +-- transfers/
|   +-- adjustments/
|
+-- customers/
|   +-- list/
|   +-- [id]/
|
+-- sales/
|   +-- new/
|   +-- [id]/
|
+-- returns/
|   +-- new/
|   +-- [id]/
|
+-- payments/
|
+-- maintenance/
|
+-- suppliers/
|
+-- reports/
|
+-- users/
|
+-- settings/
```

---

# 36. Dashboard

Main dashboard cards:

```text
+----------------+ +----------------+
| Total Cylinders| | Available      |
|     12,450     | |     7,820      |
+----------------+ +----------------+

+----------------+ +----------------+
| With Customers | | Damaged        |
|      4,210     | |       180      |
+----------------+ +----------------+

+----------------+ +----------------+
| Outstanding    | | Today's Sales  |
|  1.2M ETB      | |   245K ETB     |
+----------------+ +----------------+
```

Daily activity:

```text
Received        120
Issued           85
Returned         42
Damaged           3
Payments      94,000 ETB
```

---

# 37. Warehouse Worker Interface

Warehouse workers should have a simpler interface.

```text
+------------------------------+
|          WAREHOUSE           |
+------------------------------+
|                              |
|       RECEIVE                |
|                              |
|       ISSUE                  |
|                              |
|       RETURN                 |
|                              |
|       TRANSFER               |
|                              |
|       SCAN CYLINDER          |
|                              |
+------------------------------+
```

This should work well as a mobile/PWA interface.

---

# 38. QR / Barcode Workflow

## Issue

```text
Select Customer
      |
      v
Scan Cylinders
      |
      v
Validate:
  - Exists
  - Available
  - Good condition
      |
      v
Confirm Issue
      |
      v
Payment / Credit
      |
      v
Generate Receipt
```

## Return

```text
Select Customer
      |
      v
Scan Cylinder
      |
      v
Verify Customer Holding
      |
      v
Inspect Condition
      |
      v
Confirm Return
      |
      v
Update Inventory
      |
      v
Calculate Financial Adjustment
```

---

# 39. Customer Dashboard

Example:

```text
ABEBE TRADING
------------------------------------------------

Customer ID: CUS-00452

Outstanding Balance:
12,500 ETB

Credit Limit:
50,000 ETB

Cylinders Currently Held:
18

------------------------------------------------

RECENT TRANSACTIONS

05 Sep   10 cylinders    15,000
08 Sep    8 cylinders    12,000
10 Sep    4 returned     -6,000

PAYMENTS

05 Sep    8,000
08 Sep    5,000

Outstanding:
12,500 ETB
```

Actions:

```text
[ Issue Cylinders ]
[ Receive Return ]
[ Record Payment ]
[ View Statement ]
```

---

# 40. Credit Management

Customer credit should include:

```text
Credit Limit
Current Credit
Available Credit
Overdue Credit
Credit Status
```

Example:

```text
Credit Limit:       50,000 ETB
Current Credit:     42,000 ETB
Available Credit:    8,000 ETB
```

If the customer attempts to take 15,000 ETB:

```text
CREDIT LIMIT EXCEEDED
```

A manager can override this if they have the appropriate permission.

---

# 41. Critical Backend Validation Rules

## Cylinder issue validation

A cylinder cannot be issued if:

```text
availability != AVAILABLE
OR
condition != GOOD
OR
availability == SCRAPPED
OR
availability == WITH_CUSTOMER
```

## Return validation

A cylinder cannot normally be returned by a customer unless:

```text
cylinder.current_customer_id == return.customer_id
```

Authorized manager overrides can be supported for exceptional cases.

## Credit validation

Customer cannot exceed credit limit unless an authorized user approves the override.

## Payment validation

Payments must not be allocated beyond the allowed outstanding amount unless overpayment is explicitly supported.

## Transaction deletion

Never delete completed inventory or financial transactions.

Use:

```text
VOID
REVERSAL
ADJUSTMENT
```

instead.

---

# 42. Database Transaction Safety

Inventory and financial operations must use PostgreSQL transactions.

Example issue workflow:

```text
BEGIN TRANSACTION

1. Lock cylinders
2. Verify availability
3. Create sale
4. Create sale items
5. Update cylinder state
6. Create inventory movements
7. Create customer ledger entry
8. Create payment
9. Commit

ROLLBACK if any step fails
```

Use row-level locking:

```sql
SELECT *
FROM cylinders
WHERE id = $1
FOR UPDATE;
```

This prevents two workers from issuing the same cylinder simultaneously.

---

# 43. Example Issue Request

```json
{
  "customerId": "customer-uuid",
  "warehouseId": "warehouse-uuid",
  "cylinders": [
    "cylinder-001",
    "cylinder-002",
    "cylinder-003"
  ],
  "payment": {
    "amount": 3000,
    "method": "CASH"
  }
}
```

Backend flow:

```text
BEGIN

Lock cylinders

001 AVAILABLE ✓
002 AVAILABLE ✓
003 AVAILABLE ✓

Create SALE

Create SALE_ITEMS

001 -> WITH_CUSTOMER
002 -> WITH_CUSTOMER
003 -> WITH_CUSTOMER

Create INVENTORY_TRANSACTIONS

Create CUSTOMER_LEDGER

Create PAYMENT

COMMIT
```

---

# 44. Idempotency

Mobile networks can cause duplicate submissions.

Use an idempotency key:

```http
Idempotency-Key: 4d1f8c...
```

If a user presses Confirm twice, the server should recognize the duplicate request.

This prevents accidental duplicate:

```text
10 cylinders issued
+
10 cylinders issued again
```

---

# 45. Audit Logging

```sql
audit_logs
----------
id UUID PK

user_id FK

action
entity_type
entity_id

old_values JSONB
new_values JSONB

ip_address
user_agent

created_at
```

Example:

```text
USER:
Warehouse Manager

ACTION:
UPDATE

ENTITY:
Cylinder CYL-001245

CHANGE:
condition GOOD -> DAMAGED

DATE:
2026-09-07 09:22
```

Audit logs should be append-only.

---

# 46. Notifications

Notifications should initially be implemented without Redis (deferred).

```text
Domain Event
     |
     v
NestJS Application Service
     |
     +-- Internal notification
     +-- Email/SMS integration
     +-- Telegram integration
```

For low-volume MVP workloads, synchronous handling or a lightweight database-backed job/outbox mechanism is sufficient.

### Future asynchronous architecture

When workload justifies it, introduce:

```text
Domain Event
     |
     v
Transactional Outbox
     |
     v
Redis (deferred) + BullMQ (deferred)
     |
     v
Workers
  +-- Telegram
  +-- SMS
  +-- Email
  +-- Reports
```

This is a **future optimization**, not an MVP dependency.

Potential alerts:

```text
Credit limit exceeded
Payment overdue
Cylinder overdue with customer
Inventory discrepancy
Cylinder marked damaged
Maintenance completed
Large return
Manager approval required
```

---

# 47. Telegram Integration

A Telegram bot can notify managers.

Example:

```text
CREDIT ALERT

Customer:
Abebe Trading

Outstanding:
42,500 ETB

Credit Limit:
40,000 ETB

Exceeded by:
2,500 ETB
```

Return notification:

```text
NEW RETURN

Customer:
Abebe Trading

Total cylinders:
15

Good:
10

Damaged:
2

Needs Repair:
3
```

The Telegram integration should be event-driven rather than tightly coupled to core business logic.

---

# 48. Event Architecture

Domain events:

```text
CylinderReceived
CylinderIssued
CylinderReturned
PaymentReceived
CylinderDamaged
CylinderRepaired
CylinderScrapped
CreditLimitExceeded
```

Example:

```text
CylinderReturned
       |
       +-- Update Inventory
       +-- Update Customer Holdings
       +-- Update Financial Ledger
       +-- Generate Receipt
       +-- Notify Manager
```

For reliability, use the **transactional outbox pattern** so events are not lost when the application crashes after a database transaction.

---

# 49. Reporting Architecture

Basic reports:

```text
PostgreSQL
    |
    v
SQL Queries
    |
    v
Reporting API
    |
    v
Next.js
```

For expensive analytics, introduce materialized views:

```text
current_inventory_summary
customer_cylinder_summary
customer_credit_summary
daily_sales_summary
daily_inventory_movements
```

---

# 50. Core Reports

## Inventory Report

```text
Cylinder Type | Total | Available | Customer | Repair | Damaged
```

## Customer Cylinder Report

```text
Customer | Cylinders | Good | Damaged | Value
```

## Credit Aging

```text
Customer
0-30 days
31-60 days
61-90 days
90+ days
Total
```

## Cylinder Accountability

```text
Total company cylinders
=
Warehouse
+
Customers
+
Repair
+
Inspection
+
Scrap
```

---

# 51. Inventory Reconciliation Engine

A scheduled reconciliation job should compare expected and actual inventory.

```text
Expected cylinders
        vs
Actual cylinder states
```

Basic equation:

```text
Received
- Issued
+ Returned
- Scrapped
+/- Adjustments
=
Current Inventory
```

If a mismatch exists:

```text
INVENTORY DISCREPANCY

Expected: 12,450
Actual:   12,447

Difference: -3 cylinders
```

This should create an alert and investigation record.

---

# 52. Security

Recommended security controls:

```text
Better Auth sessions
Better Auth account/session management
RBAC / application authorization
Rate limiting
Helmet
CORS
Input validation
SQL injection protection
Audit logging
Secure HTTP-only cookies where appropriate
Database least-privilege users
Encrypted secrets
```

Never rely only on frontend permissions.

---

# 53. Backend Project Structure

```text
src/
|
+-- config/
|
+-- middleware/
|
+-- modules/
|   |
|   +-- auth/
|   +-- users/
|   +-- customers/
|   +-- cylinders/
|   +-- inventory/
|   +-- receiving/
|   +-- sales/
|   +-- returns/
|   +-- payments/
|   +-- maintenance/
|   +-- reports/
|   +-- notifications/
|
+-- database/
|
+-- jobs/
|
+-- events/
|
+-- utils/
|
+-- app.ts
```

Each domain module:

```text
cylinders/
|
+-- cylinder.controller.ts
+-- cylinder.service.ts
+-- cylinder.repository.ts
+-- cylinder.routes.ts
+-- cylinder.schema.ts
+-- cylinder.types.ts
```

---

# 54. Backend Layering

Do not put business logic directly in controllers.

Bad:

```text
Controller
    |
    v
SQL
    |
    v
Response
```

Recommended:

```text
Controller
    |
    v
Service
    |
    v
Repository
    |
    v
PostgreSQL
```

Example:

```text
SaleController
      |
      v
SaleService
      |
      +-- InventoryService
      |
      +-- LedgerService
      |
      +-- PaymentService
      |
      v
PostgreSQL Transaction
```

---

# 55. Frontend Architecture

Use reusable domain components and keep server state separate from local UI state.

```text
components/
|
+-- dashboard/
+-- cylinders/
+-- customers/
+-- sales/
+-- returns/
+-- payments/
+-- inventory/
+-- reports/
+-- forms/
+-- tables/
+-- scanners/
+-- dialogs/
```

Recommended client state split:

```text
TanStack Query
    -> Server/API state

Zustand
    -> Local UI/workflow state

React Hook Form
    -> Form state

Zod
    -> Frontend validation

Better Auth client
    -> Authentication/session state
```

---

# 56. Mobile/PWA Strategy

Warehouse operations should work well on tablets and phones.

Priority workflows:

```text
Scan Cylinder
Receive
Issue
Return
Inspect
Transfer
```

The warehouse UI should minimize typing.

Example:

```text
SCAN -> VERIFY -> CONFIRM
```

instead of long forms.

---

# 57. Offline Considerations

If the warehouse has unreliable internet, design the frontend so scanning and workflow state can tolerate temporary disconnections.

However, avoid blindly committing financial/inventory operations offline.

Recommended approach:

```text
Offline:
Scan / prepare operation

Online:
Validate + commit transaction

Server:
Source of truth
```

For higher complexity later, implement an explicit offline queue with conflict handling.

---

# 58. MVP Scope

The first production version should include:

```text
Authentication
Users
Roles
Customers
Suppliers

Cylinder Types
Individual Cylinders

Warehouses
Locations

Receiving
Inventory

Cylinder Issuing
Cash Sales
Credit Sales
Partial Payments

Returns
Partial Returns

Customer Ledger
Basic Credit Management

Basic Dashboard
Basic Reports
Audit Logs
```

This is enough to replace the manual workflow.

---

# 59. Phase 2

Add:

```text
QR scanning
Barcode scanning
Cylinder history
Maintenance
Damage tracking
Scrapping
Advanced customer ledger
Credit aging
Advanced reports
Audit improvements
```

---

# 60. Phase 3

Add:

```text
Telegram
SMS
Notifications
Approvals
Multiple warehouses
Stock transfers
Advanced analytics
Mobile PWA
```

---

# 61. Phase 4

Potential future capabilities:

```text
RFID
Automatic gate scanning
IoT integrations
Customer portal
Supplier portal
Accounting integration
ERP integration
Advanced forecasting
```

---

# 62. Recommended Navigation

```text
Dashboard

Inventory
  +-- Cylinders
  +-- Receiving
  +-- Movements
  +-- Transfers
  +-- Adjustments

Customers
  +-- Customers
  +-- Cylinder Holdings
  +-- Credit

Sales
  +-- New Issue
  +-- History

Returns
  +-- New Return
  +-- History

Payments

Maintenance
  +-- Repairs
  +-- Damaged
  +-- Scrapped

Suppliers

Reports
  +-- Inventory
  +-- Customers
  +-- Credit
  +-- Sales
  +-- Returns
  +-- Cylinder Accountability

Administration
  +-- Users
  +-- Roles
  +-- Warehouses
  +-- Cylinder Types
  +-- Settings
```

---

# 63. Complete Business Workflow

```text
                  SUPPLIER
                     |
                     v
                RECEIVING
                     |
                     v
             REGISTER CYLINDERS
                     |
                     v
                WAREHOUSE
                     |
                     v
              CUSTOMER REQUEST
                     |
                     v
               CREDIT CHECK
                     |
              +------+------+
              |             |
           APPROVED       REJECTED
              |
              v
         SCAN CYLINDERS
              |
              v
             ISSUE
              |
       +------+---------+
       |                |
       v                v
    PAYMENT           CREDIT
       |                |
       +-------+--------+
               |
               v
         WITH CUSTOMER
               |
               v
             RETURN
               |
               v
           INSPECTION
               |
       +-------+-------+
       |       |       |
       v       v       v
     GOOD   REPAIR    SCRAP
       |       |
       |       v
       |    REPAIRED
       |       |
       +-------+
               |
               v
           AVAILABLE
```

---

# 64. Core Entity Model

The most important entities are:

```text
User
Role
Permission

Warehouse
Location

Supplier

CylinderType
Cylinder

Customer

Receipt
ReceiptItem

Sale
SaleItem

Return
ReturnItem

Payment
PaymentAllocation

CustomerLedger

InventoryTransaction

MaintenanceRecord

AuditLog
```

Core relationships:

```text
Cylinder
   |
   +-- CylinderType
   +-- Warehouse
   +-- Location
   +-- Current Customer
   +-- Inventory Transactions


Customer
   |
   +-- Sales
   +-- Returns
   +-- Payments
   +-- Customer Ledger
   +-- Cylinders


Sale
   |
   +-- Customer
   +-- Sale Items
   +-- Payments
   +-- Inventory Transactions


Return
   |
   +-- Customer
   +-- Return Items
   +-- Original Sale
   +-- Inventory Transactions
```

---

# 65. Key Design Decision

Do not model this as a normal quantity-only inventory system.

A conventional inventory system might say:

```text
12 KG cylinders:
Available = 7,820
```

This system must additionally know:

```text
CYL-001245 -> Abebe Trading
CYL-001246 -> Abebe Trading
CYL-001247 -> Warehouse A / Rack A2
CYL-001248 -> Repair
CYL-001249 -> XYZ Hotel
```

That individual-cylinder layer is what makes the following reliable:

- Partial returns
- Damaged cylinders
- Customer accountability
- Credit management
- Cylinder history
- Warehouse reconciliation
- Maintenance tracking
- Auditing

---

# 66. Implementation Order

Recommended implementation sequence:

```text
PHASE 1
|
+-- Project setup
+-- PostgreSQL
+-- Drizzle ORM
+-- Better Auth
+-- NestJS authentication module
+-- RBAC
+-- Users
|
v

PHASE 2
|
+-- Warehouses
+-- Locations
+-- Cylinder Types
+-- Cylinders
+-- Suppliers
|
v

PHASE 3
|
+-- Receiving
+-- Inventory Transactions
+-- Inventory State Machine
+-- Stock Dashboard
|
v

PHASE 4
|
+-- Customers
+-- Sales / Issues
+-- Customer Holdings
+-- Cash Payments
+-- Credit
|
v

PHASE 5
|
+-- Returns
+-- Partial Returns
+-- Inspection
+-- Damage
+-- Repair
|
v

PHASE 6
|
+-- Customer Ledger
+-- Payment Allocation
+-- Credit Aging
+-- Financial Reports
|
v

PHASE 7
|
+-- QR / Barcode
+-- Mobile PWA
+-- Audit Logs
+-- Advanced Reports
|
v

PHASE 8
|
+-- Telegram
+-- Notifications
+-- Approvals
+-- Multiple Warehouses
|
v

PHASE 9
|
+-- Analytics
+-- Reconciliation Engine
+-- RFID / Advanced Integrations
```

---


---

# Mobile-First UI/UX Design

## 1. UI/UX Strategy

The frontend must be designed **mobile-first**, not desktop-first and then compressed for mobile.

The primary operational users are warehouse workers and managers who may use phones while moving around the warehouse. The most important workflows must therefore be optimized for:

- One-handed use.
- Touch interaction.
- Camera-based QR/barcode scanning.
- Minimal typing.
- Fast confirmation.
- Clear status and error feedback.
- Poor or intermittent network conditions.
- Small screens from approximately 360px wide upward.
- Tablets and desktop as progressive enhancements.

The frontend stack is:

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
React Hook Form
Zod
```

The design principle is:

```text
MOBILE FIRST
     |
     +-- Fast operational workflows
     |
     +-- Scan instead of type
     |
     +-- Large touch targets
     |
     +-- Progressive disclosure
     |
     +-- Sticky primary actions
     |
     +-- Desktop enhancements
```

The mobile interface should never require the user to navigate through unnecessary screens to perform common warehouse operations.

---

## 2. Responsive Design Philosophy

### Primary target

The primary design target is:

```text
360px - 430px mobile width
```

The UI must remain fully usable at:

```text
360px
375px
390px
412px
430px
```

Then progressively enhance for:

```text
640px   Small tablet / large phone
768px   Tablet
1024px  Small desktop
1280px  Desktop
1440px+ Large desktop
```

### Responsive behavior

Mobile:

```text
Single column
Bottom navigation
Cards
Bottom sheets
Full-screen workflows
Sticky actions
Compact headers
```

Tablet:

```text
Two-column layouts where useful
Expanded cards
Optional side navigation
Larger tables
```

Desktop:

```text
Persistent sidebar
Multi-column dashboard
Data tables
Split panels
Keyboard shortcuts
Bulk actions
```

The business logic must remain identical across breakpoints.

Only the presentation and interaction model changes.

---

# 3. Design System

## 3.1 Design tokens

Use a centralized design token system through Tailwind CSS and CSS variables.

Define:

```text
Colors
Typography
Spacing
Border radius
Shadows
Component heights
Breakpoints
Z-index layers
```

Business states should have consistent visual treatment:

```text
AVAILABLE          -> success
WITH_CUSTOMER      -> primary/info
RESERVED           -> warning
IN_TRANSIT         -> info
BLOCKED            -> destructive
DAMAGED            -> warning/destructive
NEEDS_INSPECTION   -> warning
UNDER_REPAIR       -> info
SCRAPPED           -> muted/destructive
```

Do not rely on color alone.

Every state should also have:

- Icon.
- Label.
- Optional description.

Example:

```text
🟢 AVAILABLE
Ready to issue
```

rather than showing only a green badge.

---

## 3.2 Touch targets

Interactive elements should generally have a minimum touch target of:

```text
44px × 44px
```

Primary warehouse action buttons should preferably be:

```text
48px - 56px high
```

Examples:

```text
[ Scan Cylinder ]
[ Confirm Issue ]
[ Receive Return ]
[ Record Payment ]
```

Avoid tiny icon-only controls for important actions.

---

## 3.3 Typography

Use a clear mobile hierarchy:

```text
Page title:       24px
Section title:    18px
Card title:       16px
Body:             14px - 16px
Secondary:        12px - 14px
```

Numbers that represent money or inventory counts should be visually prominent.

Example:

```text
Outstanding Credit
35,500 ETB
```

---

# 4. Application Shell

The application shell changes based on viewport and user role.

## Mobile

Use:

```text
Top app bar
     |
Page content
     |
Optional sticky action
     |
Bottom navigation
```

Example:

```text
┌─────────────────────────────┐
│ ☰  Main Warehouse       🔔 │
├─────────────────────────────┤
│                             │
│ Page content                │
│                             │
│                             │
├─────────────────────────────┤
│ Home Inventory Customers   │
│      More                  │
└─────────────────────────────┘
```

The bottom navigation should contain the most frequently accessed areas.

Recommended:

```text
Home
Inventory
Customers
More
```

The Scan action can be a prominent central action when the warehouse role is active.

---

## Desktop

Use:

```text
┌──────────────┬──────────────────────────────┐
│              │                              │
│ Sidebar      │ Main content                 │
│              │                              │
│ Dashboard    │                              │
│ Inventory    │                              │
│ Customers    │                              │
│ Sales        │                              │
│ Returns      │                              │
│ Payments     │                              │
│ Maintenance  │                              │
│ Reports      │                              │
│ Settings     │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

Desktop navigation should never be required for mobile workflows.

---

# 5. Role-Based Mobile Navigation

The mobile navigation should be role-aware.

## Warehouse Worker

Primary navigation:

```text
Home
Scan
Inventory
Returns
More
```

Primary actions:

```text
Receive
Issue
Return
Transfer
Scan
```

## Warehouse Manager

```text
Home
Inventory
Customers
Reports
More
```

Additional actions:

```text
Approvals
Adjustments
Transfers
Damage
Maintenance
```

## Accountant

```text
Home
Customers
Payments
Ledger
Reports
```

## Administrator

```text
Home
Users
Inventory
Customers
Reports
More
```

Do not show irrelevant modules to a role.

---

# 6. Mobile Dashboard

The dashboard should prioritize operational information rather than decorative analytics.

## Warehouse dashboard

```text
┌─────────────────────────────┐
│ Good morning                │
│ Warehouse Manager           │
├─────────────────────────────┤
│                             │
│ Available                   │
│ 248 cylinders               │
│                             │
│ With Customers              │
│ 31 cylinders                │
│                             │
├─────────────────────────────┤
│                             │
│      📷 SCAN CYLINDER       │
│                             │
├────────────┬────────────────┤
│ Receive    │ Issue          │
├────────────┼────────────────┤
│ Return     │ Transfer       │
└────────────┴────────────────┘
```

Then:

```text
Recent Activity
--------------------------------
Cylinder CYL-001245
Issued to Abebe Trading
2 minutes ago

Cylinder CYL-001246
Returned
8 minutes ago
```

Avoid displaying large desktop charts on the initial mobile dashboard.

---

# 7. Universal Scan Experience

Scanning should be a first-class interaction.

The application should support:

```text
Camera QR scanning
Barcode scanning
Manual code entry
External Bluetooth scanner
```

## Scan screen

```text
┌─────────────────────────────┐
│ ← Scan Cylinder             │
├─────────────────────────────┤
│                             │
│       ┌─────────────┐       │
│       │             │       │
│       │    SCAN     │       │
│       │             │       │
│       │             │       │
│       └─────────────┘       │
│                             │
│ Align the QR/barcode        │
│ inside the frame            │
│                             │
│ [ Enter Code Manually ]     │
└─────────────────────────────┘
```

After scanning:

```text
Cylinder Found

CYL-001245
12 KG LPG Cylinder

Status
AVAILABLE

Condition
GOOD

Location
Main Warehouse / Zone A / Rack 3

[ Select Cylinder ]
```

For invalid scans:

```text
Cylinder Not Found

The scanned code does not belong
to a registered cylinder.

[ Scan Again ]
[ Enter Manually ]
```

For an unavailable cylinder:

```text
Cylinder Cannot Be Issued

Current status:
WITH CUSTOMER

Customer:
Abebe Trading

[ View Cylinder ]
[ Scan Another ]
```

The scanner must never silently accept an invalid cylinder.

---

# 8. Issue Cylinder Mobile Workflow

The issue process is one of the most important workflows.

It should be optimized for:

```text
Customer
    ↓
Scan
    ↓
Review
    ↓
Payment
    ↓
Confirm
```

## Step 1 — Select customer

```text
Issue Cylinders

Customer
┌─────────────────────────────┐
│ Search customer...       🔍 │
└─────────────────────────────┘

Recent customers
-----------------
Abebe Trading
ABC Gas
Kebede Store

[ Continue ]
```

## Step 2 — Scan cylinders

```text
Abebe Trading

Selected: 3 cylinders

[ + Scan Cylinder ]

CYL-001245   12 KG   ✓
CYL-001246   12 KG   ✓
CYL-001247   12 KG   ✓

Total: 4,500 ETB

[ Continue ]
```

The user can repeatedly scan cylinders without returning to the customer screen.

## Step 3 — Validate

The backend validates:

```text
Cylinder exists
Cylinder is AVAILABLE
Cylinder condition is issuable
Cylinder belongs to selected warehouse
Cylinder is not already assigned
User has permission
```

## Step 4 — Payment

```text
Payment

Total
4,500 ETB

Paid now
┌─────────────────────────────┐
│ 3,000                       │
└─────────────────────────────┘

Remaining
1,500 ETB

Payment method
○ Cash
○ Bank Transfer
○ Mobile Money
○ Card

[ Confirm Issue ]
```

If credit is allowed:

```text
Credit remaining:
1,500 ETB

Available credit:
18,500 ETB
```

## Step 5 — Confirmation

```text
✓ Issue Completed

3 cylinders issued to
Abebe Trading

Paid: 3,000 ETB
Credit: 1,500 ETB

[ View Receipt ]
[ New Issue ]
[ Done ]
```

---

# 9. Return Cylinder Mobile Workflow

Returns should be equally scan-driven.

```text
Return
  ↓
Select Customer
  ↓
Scan Cylinder
  ↓
Verify Customer Holding
  ↓
Inspect Condition
  ↓
Confirm Return
```

## Return screen

```text
Return Cylinders

Customer
Abebe Trading

[ Scan Cylinder ]

Selected returns: 2

CYL-001245
CYL-001246

[ Inspect ]
```

## Inspection

Each cylinder should have a simple inspection card:

```text
CYL-001245

Condition

○ GOOD
○ DAMAGED
○ NEEDS REPAIR

Notes
┌─────────────────────────┐
│ Optional notes...       │
└─────────────────────────┘
```

After inspection:

```text
2 Cylinders Returned

1 GOOD
1 NEEDS REPAIR

Good cylinder → Available
Repair cylinder → Repair Area

[ Complete Return ]
```

---

# 10. Receiving Mobile Workflow

Receiving should support rapid registration of multiple cylinders.

```text
New Receiving

Supplier
[ Select Supplier ]

Warehouse
[ Main Warehouse ]

[ Start Scanning ]

Scanned: 27
```

Each scan adds a cylinder.

```text
27 Cylinders

12 KG  × 20
15 KG  × 7

Issues:
2 need inspection

[ Review ]
[ Confirm Receipt ]
```

A batch scanning mode should keep the camera active so workers can scan cylinders continuously.

---

# 11. Transfer Workflow

For moving cylinders between warehouses or locations:

```text
Transfer

From
Main Warehouse / Zone A

To
Main Warehouse / Zone B

[ Scan Cylinders ]

Selected: 12

[ Confirm Transfer ]
```

For multi-warehouse transfers:

```text
Source:
Main Warehouse

Destination:
East Warehouse

12 cylinders selected

[ Confirm Transfer ]
```

The server should create the appropriate inventory transactions and state changes atomically.

---

# 12. Cylinder Details Mobile Screen

The cylinder detail page should answer the most important questions immediately.

```text
CYL-001245

12 KG LPG Cylinder

┌─────────────────────────────┐
│ AVAILABLE                   │
│ GOOD                        │
└─────────────────────────────┘

Current Location
Main Warehouse
Zone A / Rack A3

Serial Number
SN-123456

Last Inspection
02 Sep 2026

Next Inspection
02 Sep 2027
```

Then:

```text
Current Holder
Warehouse
```

or:

```text
Current Holder
Abebe Trading

Issued:
15 Aug 2026
```

Actions:

```text
[ Scan / Verify ]
[ Move ]
[ Inspect ]
[ View History ]
```

---

# 13. Cylinder History

History should be chronological and easy to scan.

```text
Cylinder History

CYL-001245

02 Sep
Inspection
GOOD

15 Aug
Issued
Main Warehouse → Abebe Trading

10 Aug
Moved
Rack A2 → Rack A3

01 Aug
Received
Supplier → Main Warehouse
```

Each event can expand for additional metadata:

```text
Performed by
Warehouse Worker

Reference
ISS-2026-001245

Notes
Customer delivery
```

History is read-only.

---

# 14. Customer Mobile Screen

Customer overview:

```text
Abebe Trading

Outstanding
7,000 ETB

Cylinders
18

Credit Limit
25,000 ETB

Available Credit
18,000 ETB
```

Quick actions:

```text
[ Issue ]
[ Return ]
[ Payment ]
[ Statement ]
```

Tabs:

```text
Overview
Cylinders
Transactions
Payments
```

---

# 15. Customer Cylinder Holdings

The customer cylinder screen should prioritize accountability.

```text
Cylinders Held

18 cylinders

12 KG
----------------
CYL-001245
Issued 15 Aug

CYL-001246
Issued 15 Aug

CYL-001247
Issued 16 Aug

15 KG
----------------
CYL-001300
Issued 18 Aug
```

Support:

```text
Search
Filter by type
Filter by issue date
Scan cylinder
```

---

# 16. Customer Financial Screen

```text
Account Statement

Outstanding
7,000 ETB

Credit Limit
25,000 ETB
```

Transactions:

```text
05 Sep
Cylinder Issue
+15,000 ETB

05 Sep
Payment
-8,000 ETB

08 Sep
Cylinder Issue
+12,000 ETB
```

Use a clear debit/credit presentation.

Do not rely solely on color to distinguish amounts.

---

# 17. Payment Workflow

Payment entry should be extremely simple.

```text
Record Payment

Customer
Abebe Trading

Amount
┌─────────────────────────┐
│ 5,000 ETB               │
└─────────────────────────┘

Method
[ Cash ▼ ]

Reference
Optional

[ Record Payment ]
```

After completion:

```text
✓ Payment Recorded

5,000 ETB
Cash

New outstanding balance:
2,000 ETB

[ View Account ]
[ Done ]
```

---

# 18. Sales and Transaction History

Mobile should use cards rather than wide tables.

```text
Transactions

ISS-001245
Abebe Trading
10 cylinders
15,000 ETB
PARTIALLY PAID
05 Sep

ISS-001246
ABC Gas
5 cylinders
7,500 ETB
PAID
05 Sep
```

Desktop can switch to:

```text
Data table
Number | Customer | Date | Total | Paid | Balance | Status
```

---

# 19. Returns History

Mobile:

```text
RET-00123
Abebe Trading
6 cylinders
05 Sep 2026

5 Good
1 Damaged

COMPLETED
```

Filters:

```text
Today
This week
This month
Custom
```

---

# 20. Inventory Screen

The mobile inventory screen should prioritize summary and search.

```text
Inventory

248 Available
31 With Customers
7 Damaged
4 Under Repair

[ Search / Scan ]

Cylinder Types

12 KG
Available: 145

15 KG
Available: 63

25 KG
Available: 40
```

Tapping a type opens the individual cylinder list.

---

# 21. Inventory Movement Screen

```text
Movements

Today

09:42
ISSUE
CYL-001245
→ Abebe Trading

09:31
RETURN
CYL-001246
← Abebe Trading

09:12
MOVE
CYL-001247
Rack A2 → Rack A3
```

Use filters:

```text
Type
Date
Warehouse
User
Cylinder
Customer
```

---

# 22. Maintenance Mobile UI

Maintenance should support workers operating in the field/warehouse.

```text
Maintenance

Under Repair
4

Needs Inspection
7

Completed Today
3
```

Cylinder repair card:

```text
CYL-001245
12 KG

Problem:
Valve damaged

Status:
IN_REPAIR

Started:
05 Sep

[ Update ]
[ Complete Repair ]
```

---

# 23. Reports on Mobile

Reports should be summarized rather than forcing desktop tables onto phones.

Example:

```text
Inventory Report

Total Cylinders
290

Available
248

With Customers
31

Damaged
7

Under Repair
4
```

For detailed reports:

```text
[ Filter ]
[ Export ]

Results
```

Large tables should support horizontal scrolling only when unavoidable.

Prefer:

```text
Cards
Grouped lists
Expandable rows
```

---

# 24. Mobile Forms

Forms should follow these rules:

1. One logical section at a time.
2. Use native mobile input types where appropriate.
3. Use searchable selectors instead of huge dropdowns.
4. Autofocus the first useful field.
5. Preserve entered values after validation errors.
6. Show inline validation.
7. Keep the primary action visible.
8. Avoid unnecessary fields.
9. Use progressive disclosure for advanced fields.

Example:

```text
Required
---------
Customer
Cylinder
Amount

Advanced
---------
Reference
Notes
Discount
Tax
```

---

# 25. Sticky Primary Actions

Important workflows should use sticky bottom actions.

Example:

```text
┌─────────────────────────────┐
│                             │
│ Form content                │
│                             │
│                             │
├─────────────────────────────┤
│ [ Confirm Issue ]           │
└─────────────────────────────┘
```

Do not place critical actions only at the top or bottom of long pages.

---

# 26. Bottom Sheets

Use bottom sheets for contextual actions on mobile.

Example cylinder actions:

```text
CYL-001245

──────────────

View Details
Move Cylinder
Inspect
View History
Report Damage

Cancel
```

Use full-screen pages for complex workflows.

Use bottom sheets for short contextual actions.

---

# 27. Loading States

Avoid blank screens.

Use:

```text
Skeleton cards
Skeleton lists
Button loading indicators
Scan processing indicators
```

Example:

```text
Loading cylinder...

██████████████
████████
████████████
```

For mutation operations:

```text
Processing issue...
Please keep this screen open.
```

This is especially important for inventory and financial operations.

---

# 28. Error States

Errors must explain what happened and what the user can do.

Bad:

```text
Error 409
```

Good:

```text
Cylinder Already Issued

CYL-001245 is currently with
Abebe Trading.

You cannot issue it again.

[ View Cylinder ]
[ Scan Another ]
```

For network failures:

```text
Connection Problem

We couldn't reach the server.

Your operation has not been confirmed.

[ Try Again ]
```

Never show a success state until the backend confirms the transaction.

---

# 29. Confirmation Dialogs

Use confirmations for irreversible or financially significant actions.

Examples:

```text
Confirm Cylinder Issue?

3 cylinders
4,500 ETB

Customer:
Abebe Trading

Payment:
3,000 ETB
Credit:
1,500 ETB

[ Cancel ] [ Confirm Issue ]
```

For destructive actions:

```text
Scrap Cylinder?

CYL-001245

This will permanently mark the
cylinder as SCRAPPED.

[ Cancel ] [ Scrap Cylinder ]
```

Use stronger confirmation requirements for scrapping, voiding payments, and inventory adjustments.

---

# 30. Success Feedback

Use immediate, unmistakable feedback:

```text
✓
Issue Completed
```

For short actions, use a toast.

For major workflows, use a completion screen.

Examples:

```text
Payment Recorded
Return Completed
Transfer Completed
Cylinder Registered
Receipt Confirmed
```

---

# 31. Offline and Network-Aware UX

The backend remains the source of truth.

The mobile UI may cache read-only data and preserve draft form state, but it should not blindly commit financial or inventory mutations offline.

Show network state:

```text
● Online
```

or:

```text
○ Offline

Read-only data may be outdated.
Transactions require connection.
```

For a failed mutation:

```text
Transaction Not Confirmed

The server did not confirm this operation.

Do not submit it again until the
result is verified.

[ Check Transaction Status ]
```

This prevents duplicate inventory or payment operations.

---

# 32. Optimistic UI Rules

Do **not** optimistically update critical inventory or financial state.

Avoid:

```text
User taps Issue
      ↓
UI immediately says issued
      ↓
API fails
```

Instead:

```text
User taps Issue
      ↓
Disable duplicate submission
      ↓
Backend transaction
      ↓
Confirmed
      ↓
Update UI
```

TanStack Query should invalidate/refetch authoritative resources after successful mutations.

---

# 33. Accessibility

The UI should target WCAG 2.2 AA where practical.

Requirements:

- Keyboard accessibility on desktop.
- Screen-reader labels.
- Visible focus states.
- Adequate contrast.
- Touch targets >= 44px.
- Do not rely only on color.
- Accessible form errors.
- Accessible dialogs and bottom sheets.
- Semantic HTML.
- Proper heading hierarchy.
- Reduced-motion support.

---

# 34. Next.js Frontend Architecture

Recommended structure:

```text
apps/
└── web/
    ├── app/
    │   ├── (auth)/
    │   │   └── login/
    │   │
    │   ├── (dashboard)/
    │   │   ├── dashboard/
    │   │   ├── inventory/
    │   │   │   ├── cylinders/
    │   │   │   ├── receiving/
    │   │   │   ├── movements/
    │   │   │   ├── transfers/
    │   │   │   └── adjustments/
    │   │   ├── customers/
    │   │   ├── sales/
    │   │   ├── returns/
    │   │   ├── payments/
    │   │   ├── maintenance/
    │   │   ├── suppliers/
    │   │   ├── reports/
    │   │   └── settings/
    │   │
    │   └── layout.tsx
    │
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── navigation/
    │   ├── scanner/
    │   ├── cylinders/
    │   ├── inventory/
    │   ├── customers/
    │   ├── sales/
    │   ├── returns/
    │   ├── payments/
    │   └── reports/
    │
    ├── features/
    │   ├── issue/
    │   ├── return/
    │   ├── receiving/
    │   ├── transfer/
    │   └── payment/
    │
    ├── hooks/
    ├── lib/
    ├── stores/
    ├── schemas/
    ├── types/
    └── styles/
```

Feature-specific workflows should be isolated from generic UI components.

---

# 35. State Management

Use:

### TanStack Query

For server state:

```text
Customers
Cylinders
Inventory
Sales
Returns
Payments
Reports
```

### Zustand

For local workflow/UI state:

```text
Selected cylinders
Issue workflow
Return workflow
Scanner state
UI preferences
Temporary filters
```

Do not duplicate server state in Zustand.

---

# 36. Component Architecture

Build reusable primitives first.

```text
AppShell
MobileHeader
BottomNavigation
Sidebar
PageContainer
PageHeader
SearchInput
StatusBadge
StatCard
EntityCard
DataTable
EmptyState
ErrorState
LoadingSkeleton
ConfirmDialog
BottomSheet
StickyActionBar
Scanner
ScanResult
CylinderCard
CustomerCard
PaymentForm
```

Then compose domain workflows from these primitives.

---

# 37. PWA Strategy

The application should be installable as a Progressive Web App for warehouse devices.

Support:

```text
Install to home screen
Fullscreen/standalone mode
Camera access
Fast loading
Cached static assets
Network status detection
```

Do not treat PWA caching as permission to perform inventory mutations without server confirmation.

---

# 38. Mobile Performance

Target:

```text
Fast initial render
Small JavaScript bundles
Lazy-loaded reports
Lazy-loaded scanner dependencies
Optimized images
Paginated lists
Virtualized large lists where necessary
```

Avoid loading the entire inventory into the browser.

Use server-side pagination/filtering.

Example:

```text
GET /api/v1/cylinders?
    page=1
    limit=25
    status=AVAILABLE
    type=12KG
```

---

# 39. Desktop Progressive Enhancement

Every mobile screen should have a desktop enhancement rather than a separate desktop implementation.

Example:

### Mobile

```text
Cylinder cards
```

### Desktop

```text
┌──────────┬──────────┬────────┬─────────┐
│ Code     │ Type     │ Status │ Customer│
├──────────┼──────────┼────────┼─────────┤
│ CYL-001  │ 12 KG    │ GOOD   │ —       │
│ CYL-002  │ 12 KG    │ GOOD   │ Abebe   │
└──────────┴──────────┴────────┴─────────┘
```

The same API and domain components should power both.

---

# 40. UX Rules for Critical Operations

The following rules are mandatory:

### Inventory

```text
Never hide current cylinder state.
```

### Issue

```text
Always show customer.
Always show selected cylinders.
Always show total.
Always show payment/credit.
Require backend confirmation.
```

### Return

```text
Verify current holder.
Inspect every returned cylinder.
Record resulting condition.
```

### Payment

```text
Show amount.
Show payment method.
Show customer.
Show resulting balance after confirmation.
```

### Scrapping

```text
Require explicit authorization.
Require reason.
Require confirmation.
Never delete the cylinder.
```

---

# 41. Mobile UX Definition of Done

The mobile-first frontend is complete when a warehouse worker can perform the following without needing a desktop:

```text
1. Log in
2. Open warehouse dashboard
3. Search customer
4. Scan a cylinder
5. See cylinder status
6. Issue multiple cylinders
7. Record partial payment
8. See resulting credit
9. Return multiple cylinders
10. Inspect each returned cylinder
11. Mark one damaged
12. Send damaged cylinder to repair
13. Transfer cylinders
14. View cylinder history
15. View customer holdings
16. Record a payment
17. View customer balance
18. Recover gracefully from network errors
19. Avoid duplicate submissions
20. Receive clear success/failure confirmation
```

---

# 42. Recommended Frontend Implementation Order

```text
PHASE UI-1
Foundation
|
+-- Next.js setup
+-- Tailwind
+-- shadcn/ui
+-- Design tokens
+-- Responsive layout
+-- Mobile app shell
+-- Desktop shell
+-- Navigation
|
v
PHASE UI-2
Authentication
|
+-- Login
+-- Session handling
+-- Protected routes
+-- Role-aware navigation
|
v
PHASE UI-3
Core Inventory
|
+-- Dashboard
+-- Cylinder list
+-- Cylinder details
+-- Search
+-- Filters
+-- History
|
v
PHASE UI-4
Scanner
|
+-- Camera scanner
+-- Barcode support
+-- Manual entry
+-- Scan result
+-- Scan errors
|
v
PHASE UI-5
Warehouse Operations
|
+-- Receiving
+-- Issue
+-- Return
+-- Transfer
+-- Inspection
|
v
PHASE UI-6
Customers & Finance
|
+-- Customer list
+-- Customer details
+-- Holdings
+-- Payments
+-- Ledger
+-- Credit
|
v
PHASE UI-7
Maintenance & Reports
|
+-- Repairs
+-- Damage
+-- Scrap
+-- Reports
+-- Export
|
v
PHASE UI-8
PWA & Polish
|
+-- Installable PWA
+-- Offline awareness
+-- Performance
+-- Accessibility
+-- Error handling
+-- Loading states
+-- Empty states
+-- Final responsive QA
```

---

# 43. Frontend Quality Gates

Before considering the frontend production-ready, test every critical screen at:

```text
360 × 800
375 × 812
390 × 844
412 × 915
768 × 1024
1024 × 768
1280 × 800
1440 × 900
```

Test:

```text
Touch
Keyboard
Camera
Slow network
Offline transition
API failure
Long customer names
Large cylinder lists
Large transaction lists
Large monetary values
Validation errors
Permission restrictions
```

The most important test is not visual.

It is:

> Can a warehouse worker complete an issue or return operation quickly, correctly, and without accidentally creating a duplicate transaction?

---

# 44. Final Mobile-First Architecture

The frontend architecture should ultimately look like:

```text
                    NEXT.JS
                       |
              +--------+--------+
              |                 |
         Mobile UI          Desktop UI
              |                 |
              +--------+--------+
                       |
                Shared Features
                       |
       +---------------+----------------+
       |               |                |
    Inventory       Customers       Finance
       |               |                |
       +---------------+----------------+
                       |
                 TanStack Query
                       |
                 NestJS REST API
                       |
              Better Auth Sessions
                       |
                  PostgreSQL
                       |
                  Drizzle ORM
```

The key architectural principle is:

```text
ONE DOMAIN
    +
ONE API
    +
ONE SOURCE OF TRUTH
    +
RESPONSIVE PRESENTATION
    =
MOBILE-FIRST CYLINDER PLATFORM
```

The mobile UI is therefore not a reduced version of the desktop application. It is the **primary operational interface**, while tablet and desktop layouts progressively enhance the same system.


# 67. Definition of Done for MVP

The MVP should be considered complete only when the system can correctly perform this complete scenario:

```text
1. Register supplier
2. Register warehouse
3. Register cylinder type
4. Register 100 individual cylinders
5. Receive cylinders into warehouse
6. See 100 available cylinders
7. Register customer
8. Issue 10 cylinders
9. Record 5,000 ETB payment
10. Record remaining amount as credit
11. See 10 cylinders with customer
12. See customer's outstanding balance
13. Customer returns 6 cylinders
14. Scan returned cylinders
15. Mark 5 GOOD
16. Mark 1 DAMAGED
17. Move 5 back to available stock
18. Move 1 to repair/damage area
19. Update customer's cylinder holding to 4
20. Apply appropriate financial adjustment
21. View complete cylinder history
22. View complete customer ledger
23. View inventory reconciliation
24. See all operations in audit logs
```

If this scenario works correctly, the core system is sound.

---

# 68. Final Architecture

The final platform should be understood as three interconnected systems:

```text
                 CYLINDER PLATFORM
                        |
        +---------------+---------------+
        |               |               |
        v               v               v
   PHYSICAL         CUSTOMER        FINANCIAL
   INVENTORY        MANAGEMENT       MANAGEMENT
        |               |               |
        |               |               |
   Cylinders        Customers       Sales
   Locations        Holdings        Payments
   Movements        Issues          Credit
   Conditions       Returns         Ledger
   Maintenance      History         Statements
        |               |               |
        +---------------+---------------+
                        |
                        v
                 AUDIT / REPORTING
                        |
              +---------+---------+
              |                   |
              v                   v
          Dashboard          Notifications
                                  |
                         +--------+--------+
                         |                 |
                         v                 v
                      Telegram          SMS/Email
```

The most important architectural rule is:

```text
CURRENT STATE
     +
IMMUTABLE TRANSACTION HISTORY
     +
FINANCIAL LEDGER
     =
RELIABLE CYLINDER MANAGEMENT SYSTEM
```

This architecture can start with a single warehouse and hundreds of cylinders and scale to multiple warehouses and hundreds of thousands of individually tracked cylinders without changing the fundamental model.
