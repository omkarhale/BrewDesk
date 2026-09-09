# BrewDesk - Copilot Instructions

## Project Overview

BrewDesk is a SaaS-style office management application.

Main modules:
- Authentication and authorization
- User management
- Employee management
- Department management
- Shift management
- Attendance
- Attendance Regularization
- Leave Management
- Reports
- Chai/Coffee/Beverage management

Always inspect the existing implementation before creating or modifying code.

Do not invent entities, fields, relationships, APIs, roles, or business rules when they may already exist in the project.

---

# Technology Stack

## Backend

- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- JWT authentication
- PostgreSQL
- Lombok
- Jakarta Validation

Follow the existing Spring Boot project structure and coding conventions.

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Redux Toolkit where existing state management requires it
- Existing reusable UI components

Follow the existing frontend architecture and component conventions.

---

# General Development Rules

Before making changes:

1. Inspect the relevant existing code.
2. Understand existing entities and relationships.
3. Search for existing reusable components/services/utilities.
4. Check existing API conventions.
5. Check existing security/authorization rules.
6. Make the smallest safe change.
7. Do not modify unrelated modules.

Never rewrite working functionality without a clear reason.

Prefer extending existing functionality over creating duplicate functionality.

---

# Backend Rules

## Architecture

Follow the existing separation:

Controller
→ Service
→ Repository
→ Entity

Use DTOs for API requests and responses.

Do not expose JPA entities directly from REST APIs unless the existing architecture explicitly does so.

Keep business logic inside services rather than controllers.

Keep database access inside repositories.

---

## Entity Rules

Before creating a new entity:

- Search for an existing entity that already represents the concept.
- Reuse existing relationships where possible.
- Avoid duplicate employee/user/department/shift data.

Do not create database columns only for frontend display requirements.

Use proper foreign-key relationships.

Use enums for controlled business states/types when appropriate.

Follow existing timestamp/auditing conventions.

---

# DTO Rules

API responses should contain only the data required by the frontend.

Prefer flat, clear DTOs.

Example:

employeeId
employeeCode
employeeName
shiftId
shiftName

Do not unnecessarily return complete nested User/Employee entities.

Before adding a response field, search all consumers of the DTO.

Avoid breaking existing API consumers.

---

# Validation

Backend validation is authoritative.

Use Jakarta Validation for request DTOs.

Frontend validation should use the existing React Hook Form + Zod pattern.

Do not rely only on frontend validation for security or business rules.

Validate:

- required fields
- date/time values
- relationships
- ownership
- permissions
- invalid state transitions
- duplicate requests where applicable

Return clear validation/error messages.

---

# Security

Security must always be enforced on the backend.

Never rely only on hiding frontend buttons.

Follow existing Spring Security and JWT configuration.

Respect existing roles and permissions.

Before adding a new permission or role, inspect the existing security model.

Users must not be able to access or modify another employee's data unless their role/relationship permits it.

Managers should only perform manager actions for employees they are authorized to manage.

Admin/HR capabilities should follow the existing authorization model.

---

# Attendance Rules

Attendance is a core BrewDesk module.

Do not casually modify attendance calculation logic.

Existing attendance functionality may include:

- Attendance Events
- Attendance Sessions
- Attendance Records
- Shift-based calculation
- Late minutes
- Early exit
- Total work minutes
- PRESENT
- HALF_DAY
- ABSENT
- INCOMPLETE
- Overnight/night shifts
- Monthly records
- Bulk calculation

When modifying attendance:

1. Inspect the existing calculation service first.
2. Preserve overnight shift behavior.
3. Preserve existing status calculation.
4. Preserve late/early-exit calculations.
5. Preserve session/work-minute calculation.
6. Avoid breaking existing APIs.
7. Add tests for changed behavior.

Do not rewrite the entire attendance calculation for a small feature.

---

# Regularization Rules

Regularization is an employee attendance correction workflow.

Normal workflow:

Employee
→ Submit Regularization
→ Reporting Manager
→ Approve/Reject
→ Approved request affects attendance

The employee's assigned reporting manager is the normal first-level approver.

Admin/HR should have oversight and exception-handling capabilities.

Employees must provide a reason.

Attachments may be provided where supporting evidence is useful.

Support appropriate regularization types such as:

- Missed Punch
- Incorrect Punch
- Late Arrival
- Early Exit
- Half Day
- Full Day

Half-day requests should support:

- First Half
- Second Half

Do not hard-code shift timings in the frontend.

Use the employee's configured shift and backend business rules.

Pending regularization must not change attendance.

Rejected regularization must not change attendance.

Approved regularization must be applied through controlled business logic and maintain an audit trail.

Do not silently overwrite original attendance information.

---

# HR Data Integrity

Attendance, regularization, leave, and payroll-related data are sensitive business records.

Prefer immutable/auditable history where appropriate.

Important changes should record:

- who performed the action
- when it happened
- original value where relevant
- new value where relevant
- reason where relevant

Avoid destructive updates when historical information is required.

---

# API Rules

Follow existing URL naming conventions.

Before adding an endpoint:

1. Search existing controllers.
2. Check whether the functionality already exists.
3. Reuse existing services where possible.
4. Check security requirements.
5. Check request/response DTO conventions.

Do not change existing API URLs or request parameters unless explicitly required.

Avoid breaking existing frontend API consumers.

---

# Frontend Rules

Build a modern SaaS-style UI.

Priorities:

- Clean
- Professional
- Responsive
- Accessible
- User-friendly
- Consistent
- Reusable

Prefer reusable components over duplicated JSX.

Use existing UI components before creating new ones.

Use loading states.

Use empty states.

Use error states.

Use success/error notifications where appropriate.

Use confirmation dialogs for destructive or important actions.

Forms should have:

- clear labels
- validation
- helpful error messages
- loading state
- disabled submit while processing
- success/error feedback

Do not put complex business logic directly inside JSX.

Prefer hooks, utilities, or service functions.

---

# Frontend Data Handling

Do not duplicate backend data unnecessarily.

If an API provides employeeName, use employeeName directly instead of performing repeated client-side lookups.

Avoid deeply nested `.find()` calls inside JSX.

Use memoization only where it provides a real benefit.

Do not introduce unnecessary global state.

Follow the existing API/hooks architecture.

---

# UI/UX

BrewDesk should feel like a modern HR SaaS application.

Use patterns such as:

- Cards
- Tables
- Filters
- Search
- Tabs
- Drawers
- Dialogs
- Status badges
- Empty states
- Skeleton/loading states
- Toast notifications
- Confirmation dialogs
- Responsive layouts

Keep screens understandable for employees, managers, and HR/Admin users.

Avoid unnecessarily complicated UI.

---

# Database Rules

Before changing the database:

1. Inspect existing entities.
2. Inspect existing relationships.
3. Check existing migrations/schema strategy.
4. Avoid duplicate data.
5. Consider indexes for frequently filtered fields.
6. Consider foreign-key constraints.
7. Preserve existing data.

Never add a database column merely because it is convenient for the frontend.

---

# Testing

For backend changes:

- Compile the project.
- Run relevant tests.
- Test validation.
- Test authorization.
- Test important business rules.
- Test edge cases.

For attendance-related changes, test:

- normal shifts
- overnight shifts
- missing punches
- odd number of punches
- late arrival
- early exit
- half day
- full day

For frontend changes:

- TypeScript errors
- validation
- loading state
- empty state
- error state
- successful submission
- permission/visibility behavior

Do not claim something is tested if it was not actually tested.

---

# Git Safety

Before modifying a large area:

- Inspect `git status`.
- Keep changes focused.
- Do not modify unrelated files.
- Do not delete working code without a reason.
- Do not reset/revert user changes without permission.

After completing a task:

Report:

1. Files changed
2. What changed
3. Tests/build status
4. Any remaining issue

Do not create commits unless explicitly requested.

---

# Implementation Strategy

For larger features use:

Inspect
→ Plan
→ Implement
→ Test
→ Review

Do not implement an entire large module in one uncontrolled change.

Break large features into small phases.

Only implement the phase requested by the user.

After completing the requested phase, stop and report the result.

---

# Important Rule

When requirements are ambiguous:

Do not guess silently.

First inspect the existing code and determine whether the answer already exists.

If a business decision genuinely cannot be determined from the codebase, explain the decision that needs to be made before implementing it.

Always prefer consistency with the existing BrewDesk architecture.