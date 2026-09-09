# BrewDesk - Attendance Regularization Module

## Goal

Build a production-ready attendance regularization module for BrewDesk.

The module allows employees to request correction of attendance records when
their punches or attendance status are incorrect.

Follow the existing BrewDesk architecture and conventions.

---

## Existing Architecture

Backend:
- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- PostgreSQL
- Lombok
- Jakarta Validation

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Existing UI components
- React Hook Form
- Zod

Existing attendance concepts include:
- EmployeeProfile
- User
- Department
- Shift
- AttendanceEvent
- AttendanceSession
- AttendanceRecord
- AttendanceCalculationService

IMPORTANT:
Inspect the existing code before implementing anything.
Do not invent relationships or field names.

---

# 1. Approval Workflow

Normal workflow:

Employee
    ↓
Submit Regularization Request
    ↓
Employee's Reporting Manager
    ↓
Approve / Reject
    ↓
If approved
    ↓
Attendance is corrected/recalculated

The employee's assigned reporting manager is the primary approver.

HR/Admin should NOT be required to approve every request.

ADMIN/HR should have the ability to:
- view requests
- monitor requests
- handle exceptions
- override/resolve requests where authorized

Use the existing EmployeeProfile.managerId relationship if applicable.

Do not create duplicate manager relationships.

---

# 2. Request Status

Use a clear lifecycle:

PENDING
APPROVED
REJECTED
CANCELLED

Do not allow invalid status transitions.

Example:

PENDING → APPROVED
PENDING → REJECTED
PENDING → CANCELLED

An already APPROVED or REJECTED request should not be approved again.

---

# 3. Regularization Types

Support:

- MISSED_PUNCH
- INCORRECT_PUNCH
- LATE_ARRIVAL
- EARLY_EXIT
- HALF_DAY
- FULL_DAY

The design should allow future types to be added.

---

# 4. Employee Request

Employee must provide:

- attendance date
- regularization type
- requested punch-in time when applicable
- requested punch-out time when applicable
- half-day selection when applicable
- reason
- optional attachments

Reason is mandatory.

Reason must be meaningful and validated.

Do not allow empty/blank reasons.

---

# 5. Half Day

Half-day requests must support:

- FIRST_HALF
- SECOND_HALF

Do not hard-code half-day working hours.

Use the employee's assigned Shift configuration and existing attendance rules.

Backend must validate requested times against the applicable shift.

Frontend should dynamically show only fields relevant to HALF_DAY.

Example:

Shift:
09:30 → 18:30

FIRST_HALF may represent the first portion of the working day.

SECOND_HALF may represent the second portion.

The exact permitted time must be derived from the configured shift/business rules,
not hard-coded in the frontend.

---

# 6. Validation

Backend validation is authoritative.

Validate:

- employee exists
- employee is active where applicable
- attendance date is valid
- shift exists
- regularization type is valid
- requested times are valid
- punch-out is after punch-in
- requested times are compatible with shift
- reason is present
- duplicate/pending regularization for same employee/date/type is handled
- employee cannot approve their own request
- only authorized manager/admin roles can approve
- invalid status transitions are rejected

Frontend validation should mirror backend validation using existing
React Hook Form + Zod conventions.

---

# 7. Attachments

Allow optional supporting documents.

Supported types:

- PDF
- JPG/JPEG
- PNG

Examples:
- medical document
- appointment proof
- travel proof
- other supporting evidence

Do not make attachments mandatory for every regularization type.

Do not store large binary files directly in PostgreSQL unless the existing
project architecture already requires it.

Prefer:
- file storage
- attachment metadata/reference in database

Attachment metadata should include where appropriate:

- original filename
- content type
- file size
- storage reference
- uploaded timestamp
- uploaded by

Enforce file size and type validation.

Do not trust client-provided MIME type alone.

---

# 8. Audit Trail

Regularization is an HR-sensitive workflow.

Maintain an audit history.

The system should be able to answer:

- who submitted the request?
- when was it submitted?
- who approved/rejected it?
- when?
- what was the original attendance?
- what correction was requested?
- what was finally applied?
- rejection reason if rejected
- cancellation information if cancelled

Do not silently overwrite important attendance information.

---

# 9. Attendance Integration

IMPORTANT:

Do not rewrite the existing AttendanceCalculationService blindly.

First inspect the existing attendance calculation logic.

Approved regularization should affect attendance only after approval.

PENDING regularization must NOT change attendance.

REJECTED regularization must NOT change attendance.

APPROVED regularization may correct/recalculate attendance.

Preserve existing:
- night shift handling
- overnight shifts
- late calculation
- early exit calculation
- work minutes
- attendance sessions
- PRESENT
- HALF_DAY
- ABSENT
- INCOMPLETE

Use the smallest safe integration with the existing attendance module.

---

# 10. Database Design Principles

Do NOT duplicate:

- employee name
- employee code
- manager information
- shift information

Reuse existing entities and relationships.

Do not add employeeName as a database column just for display.

Use proper foreign keys.

Use enums where appropriate.

Use audit timestamps following existing project conventions.

---

# 11. API Requirements

Design REST APIs following existing BrewDesk conventions.

Expected capabilities:

Employee:
- create regularization request
- view own requests
- view request details
- cancel eligible pending request

Manager:
- view pending requests assigned to manager
- view request details
- approve
- reject

Admin/HR:
- view/filter all requests
- view details
- handle authorized exceptions/overrides

Before implementing endpoints:
inspect existing controller naming, security rules,
DTO conventions and exception handling.

Do not change existing attendance API URLs.

---

# 12. Security

Use existing Spring Security roles.

Authorization must be enforced on the backend.

Employee:
- can create/view their own requests

Reporting Manager:
- can review requests belonging to employees they manage

Admin/HR:
- can monitor and handle authorized exceptions

Never rely only on frontend hiding buttons.

Backend must enforce ownership and authorization.

---

# 13. Frontend UX

Build a modern SaaS-style UX consistent with BrewDesk.

Employee experience:

Attendance
→ Regularization
→ New Request

Form should contain:

1. Attendance Date
2. Regularization Type
3. Existing Attendance Summary
4. Requested correction
5. Reason
6. Attachments
7. Preview
8. Submit

Show existing attendance before requesting correction so the employee
understands what they are correcting.

Example:

Current:
IN 09:50
OUT Missing
Status INCOMPLETE

Requested:
IN 09:30
OUT 18:30

---

# 14. Dynamic Form

Do not show irrelevant fields.

MISSED_PUNCH:
show relevant missing punch fields.

INCORRECT_PUNCH:
show corrected IN/OUT.

LATE_ARRIVAL:
show corrected IN.

EARLY_EXIT:
show corrected OUT.

HALF_DAY:
show FIRST_HALF / SECOND_HALF and relevant times.

FULL_DAY:
show applicable full-day correction information.

---

# 15. Manager UI

Manager should have:

- Pending requests count
- Request list
- Employee
- Date
- Type
- Current attendance status
- Requested correction
- Reason
- Attachment indicator
- Submitted time
- Approve
- Reject

Before approval show a comparison:

CURRENT ATTENDANCE
vs
REQUESTED ATTENDANCE

Example:

Current:
09:50 → INCOMPLETE

Requested:
09:30 → 18:30

This makes approval safer.

---

# 16. Rejection

When rejecting:

Reason is mandatory.

Example:

"Requested time could not be verified."

Store rejection reason in the regularization record/audit history.

---

# 17. Attachment UX

Allow:

- drag and drop
- file picker
- file preview where possible
- remove attachment before submission
- filename
- size
- upload status
- validation error

Do not expose private files publicly.

---

# 18. Implementation Rules

Before changing code:

1. Inspect existing entities.
2. Inspect EmployeeProfile → User relationship.
3. Inspect manager relationship.
4. Inspect AttendanceRecord.
5. Inspect Shift.
6. Inspect attendance calculation.
7. Inspect security roles.
8. Inspect existing API/DTO conventions.
9. Inspect frontend attendance patterns.

Do not assume field names.

Do not create duplicate concepts.

Do not modify unrelated modules.

Prefer reusable components.

Keep backend validation authoritative.

Keep attendance calculation logic isolated.

---

# 19. Implementation Order

Implement in phases.

PHASE 1:
Database entities + enums + relationships.

PHASE 2:
Repositories.

PHASE 3:
DTOs + validation.

PHASE 4:
Service + workflow.

PHASE 5:
Controller + security.

PHASE 6:
Attachment handling.

PHASE 7:
Attendance integration.

PHASE 8:
Employee frontend.

PHASE 9:
Manager approval frontend.

PHASE 10:
Admin/HR monitoring.

PHASE 11:
Tests.

Do not implement all phases in one response.

Only implement the phase explicitly requested.

After each phase:
- compile/test
- report changed files
- report errors if any
- stop