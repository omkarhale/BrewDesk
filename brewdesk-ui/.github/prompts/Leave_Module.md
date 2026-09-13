BrewDesk Leave Management Module — Kiro Implementation Plan

1. Objective

Build a production-quality Leave Management module for BrewDesk HRMS with:

Employee leave application

Reporting Manager-only approval/rejection

Super Admin/Admin leave type and policy management

Department-based leave assignment

Gender-based leave eligibility/visibility

Privilege Leave (PL) accrual of 1.25 days per month

PL accrual calculated from the employee's joining date, not January 1

Proper backend authorization and validation

Transaction-safe leave approval and balance updates

Audit/history tracking

Attendance integration

Modern startup-style responsive UI

A consistent modern date/time/calendar experience across the whole project

Automated tests and verification

Clean layered architecture and maintainable code

This is an implementation specification for Kiro. Work strictly phase-by-phase. Do not implement the entire module in one task.

2. NON-NEGOTIABLE BUSINESS RULES

2.1 Roles

The system has four application roles:

SUPER_ADMIN

ADMIN

REPORTING_MANAGER

EMPLOYEE

Do not introduce unnecessary additional roles unless the existing architecture already requires them.

2.2 Leave Application Workflow

Normal employee workflow:

Employee
   |
   | Apply for leave
   v
PENDING
   |
   | Reporting Manager reviews
   +-------------------+
   |                   |
 APPROVED            REJECTED

Important:

An employee can apply only for themselves.

Only the employee's actual Reporting Manager can approve/reject the request.

Approval authority must be validated on the backend.

Do NOT rely only on frontend button visibility.

Super Admin/Admin are NOT the normal approval step.

Super Admin/Admin manage leave types, policies, balances/assignments and configuration according to their permissions.

Do not create an approval workflow where Admin/Super Admin must approve an employee's normal leave request.

3. ROLE RESPONSIBILITIES

3.1 Super Admin

Super Admin should have the highest administrative access.

Expected access:

Manage leave types

Manage leave policies

Assign/configure leaves according to department

Manage leave rules

View leave requests/history

View employee leave balances

Manage/adjust balances where authorized

View reports

Access attendance-related functionality already assigned to Super Admin

Access the new Leave module administration screens

Maintain system-wide configuration

Super Admin does NOT replace the Reporting Manager in the normal employee approval flow.

3.2 Admin

Admin should have administrative leave-management capabilities, subject to the existing application authorization model.

Expected access:

Create/update/deactivate leave types

Create/update leave policies

Assign leave policies/types according to department

View leave configuration

View leave balances/history where permitted

Perform authorized administrative balance adjustments

View leave reports where permitted

Admin does NOT become the normal approval authority for employee leave.

3.3 Reporting Manager

Reporting Manager should:

View leave requests submitted by employees who report to them

Approve leave

Reject leave

View relevant employee leave balance

View leave history

Add rejection/approval remarks where supported

Backend must verify:

request.employee.reportingManagerId == authenticatedUser.id

Do not trust a manager ID supplied by the frontend.

3.4 Employee

Employee should:

View eligible leave types

View available leave balances

Apply for leave

Select date/date range

Select full-day/half-day where policy allows

Add reason/remarks

Upload supporting documents where policy requires/allows

View own leave requests

View request status

Cancel eligible requests

View leave calendar/history

Employee cannot:

Approve own leave

Approve another employee's leave

Change their own leave balance

Change leave policy

Create leave types

4. USER MANAGEMENT IS THE SOURCE OF TRUTH FOR GENDER

Gender must NOT be duplicated as a separate employee field inside the Leave module.

Existing User Management should contain the user's gender.

Expected values:

MALE
FEMALE
OTHER

When Admin or Super Admin creates/updates a user, they can assign the user's gender through User Management.

Leave module must read the gender from the existing User/User Management domain.

Do NOT create another gender column in leave tables unless the existing architecture absolutely requires a historical snapshot for audit. If a snapshot is ever required, document the reason and do not use it as the current source of truth.

5. GENDER-BASED LEAVE VISIBILITY AND ELIGIBILITY

Leave types can have eligibility rules based on gender.

Example:

Maternity Leave
Allowed gender: FEMALE

Therefore:

FEMALE employee -> Maternity Leave visible/eligible
MALE employee   -> Maternity Leave not visible and not eligible

Important:

Frontend filtering is only for UX.

Backend must enforce eligibility.

A male employee must not be able to submit a Maternity Leave request by manually calling the API.

OTHER should follow the configured policy rather than being silently treated as MALE/FEMALE.

Recommended leave-type configuration:

genderEligibility:
    ALL
    FEMALE
    MALE
    OTHER
    CUSTOM

If CUSTOM is not needed initially, keep the design extensible without overengineering.

6. DEPARTMENT-BASED LEAVE ASSIGNMENT

Leave types/policies must support department-based assignment.

Example:

Engineering -> PL + SL + CL
HR           -> PL + SL + CL
Sales        -> PL + SL + CL + Travel Leave

Requirements:

Admin/Super Admin can configure which leave policy/types apply to which departments.

Employee should receive only the leave configuration applicable to their department.

Backend must determine the employee's department from the existing Employee/User domain.

Do not trust a department ID supplied by an employee.

Changes to department assignment must not corrupt historical leave transactions.

Design should support future expansion to:

Location

Employment type

Grade

Designation

Tenure

Custom eligibility

Do not implement all future dimensions unless needed for the current phase.

7. PRIVILEGE LEAVE (PL) ACCRUAL

This is a critical business rule.

PL accrual

Every eligible employee receives:

1.25 PL days per month

Accrual begins from the employee's joining date.

It must NOT automatically start from January 1.

Example:

Joining date: 15 March

March -> accrual according to configured joining-date proration policy
April -> +1.25
May   -> +1.25
June  -> +1.25
...

The exact first-month proration behavior must be configurable/documented during implementation instead of being silently assumed.

Recommended configuration:

monthlyAccrual = 1.25
accrualStart = JOINING_DATE
proration = CONFIGURABLE

Do not hardcode the accrual engine in a controller.

8. ACCRUAL ENGINE REQUIREMENTS

The accrual system must:

Prevent duplicate monthly accrual

Be idempotent

Be transaction-safe

Handle employees joining mid-month

Handle inactive employees according to policy

Handle department/eligibility changes safely

Maintain an audit trail

Never silently overwrite historical balances

Support recalculation/repair by an authorized administrator if required

Recommended approach:

LeaveAccrualTransaction
    employee
    leaveType
    accrualPeriod
    amount
    transactionType
    reference
    createdAt

Add a unique constraint such as:

(employee_id, leave_type_id, accrual_period)

for recurring accrual transactions where appropriate.

This prevents duplicate monthly accrual.

9. LEAVE BALANCE MODEL

Use a proper balance model rather than storing only one mutable number.

Recommended conceptual fields:

openingBalance
accrued
used
pending
adjusted
available

Example:

available =
openingBalance
+ accrued
+ adjusted
- approvedUsed
- otherApplicableDeductions

Pending requests should not permanently deduct the balance unless the policy explicitly requires reservation.

If pending leave reserves balance, clearly distinguish:

available
reserved/pending
used

Do not mix these concepts.

10. RECOMMENDED INITIAL LEAVE TYPES

The system must be configurable rather than hardcoding these permanently.

Suggested initial types:

PL — Privilege Leave

Monthly accrual: 1.25

Joining-date based accrual

Configurable carry forward

SL — Sick Leave

Configurable yearly/monthly allocation

Optional medical document rule

CL — Casual Leave

Configurable allocation

Configurable carry forward

Maternity Leave

Gender eligibility configured

Female visibility/eligibility by default

Duration configurable according to company/legal policy

Paternity / Partner Leave

Eligibility and duration configurable

Bereavement Leave

Configurable duration

Marriage Leave

Configurable duration

LWP — Leave Without Pay

Usually no paid balance

Configurable approval/eligibility rules

Do not hardcode legal durations into the application unless the organization explicitly approves them. Policy values must be configurable.

11. LEAVE POLICY DESIGN

A leave policy should support configurable rules such as:

Leave Type
Department
Gender Eligibility
Allocation
Accrual Frequency
Accrual Amount
Accrual Start Rule
First Month Proration
Carry Forward
Carry Forward Limit
Encashment
Half Day Allowed
Minimum Notice
Maximum Consecutive Days
Backdated Leave Allowed
Cancellation Allowed
Document Required
Auto Approval
Approval Required
Active/Inactive
Effective From
Effective To

Do not implement every advanced option in Phase 1.

Build the domain so additional policy rules can be added cleanly.

12. DATA MODEL — RECOMMENDED

Inspect the existing database first. Reuse existing User, Employee, Department, Role and Reporting Manager relationships.

Recommended leave domain:

leave_types

id
code
name
description
paid
gender_eligibility
active
created_at
updated_at

leave_policies

id
leave_type_id
policy_name
accrual_frequency
accrual_amount
accrual_start_rule
proration_rule
carry_forward_enabled
carry_forward_limit
encashment_enabled
half_day_allowed
minimum_notice_days
maximum_consecutive_days
backdated_allowed
document_required
effective_from
effective_to
active
created_at
updated_at

leave_policy_departments

id
leave_policy_id
department_id
created_at

Add an appropriate unique constraint to prevent duplicate assignments.

employee_leave_balances

id
employee_id
leave_type_id
opening_balance
accrued
used
pending
adjusted
available
last_calculated_at
created_at
updated_at

If the project architecture favors derived balances, calculate from transactions instead. Do not duplicate state unnecessarily.

leave_requests

id
employee_id
leave_type_id
start_date
end_date
total_days
status
reason
remarks
approved_by
approved_at
rejected_by
rejected_at
created_at
updated_at

leave_request_days

Use this if day-level detail is needed:

id
leave_request_id
leave_date
day_type
duration

Example:

FULL_DAY
FIRST_HALF
SECOND_HALF

leave_approval_history

id
leave_request_id
action
performed_by
remarks
created_at

Possible actions:

SUBMITTED
APPROVED
REJECTED
CANCELLED

leave_accrual_transactions

id
employee_id
leave_type_id
accrual_period
amount
transaction_type
reference
created_at

Add indexes and constraints based on actual query patterns.

13. ATTENDANCE INTEGRATION

Leave must integrate correctly with Attendance.

Approved leave should not result in:

ABSENT

for the approved leave period.

Instead, attendance should recognize:

ON_LEAVE

Expected attendance precedence should be designed clearly:

Approved Leave
      |
      v
Holiday / Week Off rules
      |
      v
Attendance punch status

Do not allow the same date to become both approved leave and normal absence.

The exact precedence must be aligned with the existing attendance architecture before implementation.

14. DATE AND TIME HANDLING

Date/time must be handled consistently across the entire BrewDesk project.

Do NOT modernize date/time only inside Leave.

Audit and update existing date/time/calendar components in:

Leave

Attendance

Employee Profile

User Management

Any existing HR modules using dates

Forms

Filters

Reports

Calendar views

Requirements:

Use one consistent date library/component strategy across the frontend.

Avoid mixing multiple date libraries without a strong reason.

Handle timezone consistently.

Store timestamps appropriately on backend.

Use date-only values for leave dates where time is not relevant.

Do not use JavaScript string manipulation for date calculations when a proper date library is already available.

Prevent off-by-one-day bugs caused by UTC/local conversions.

Date range selection must be reliable.

Date/time picker UI must be modern, accessible and responsive.

Before choosing a new frontend date library, inspect the existing frontend dependencies and select the best compatible current solution rather than blindly adding dependencies.

15. MODERN STARTUP-STYLE UI

The Leave module should look like a modern HR SaaS product.

Design goals:

Clean

Minimal

Professional

Responsive

Fast

Consistent

Accessible

Mobile-friendly

Good empty states

Good loading states

Good error states

Clear status badges

Modern cards

Modern tables

Responsive filters

Modern date-range picker

Calendar visualization

Toast/notification feedback

Confirmation dialogs for destructive actions

Do not create a visually flashy UI that reduces usability.

Reuse the project's existing design system/components where possible.

Do not introduce a second UI framework unnecessarily.

16. EMPLOYEE LEAVE DASHBOARD

Recommended UI:

--------------------------------------------------
Leave Dashboard
--------------------------------------------------

PL Balance     SL Balance     CL Balance
   12.5           8.0           5.0

[ Apply Leave ]

Upcoming Leave
--------------------------------------------------
15 Sep - 17 Sep     PL     Approved

My Leave Requests
--------------------------------------------------
Date       Type     Days    Status
...

Additional sections:

Leave calendar

Pending requests

Recent leave history

Available balance

Accrual information

17. APPLY LEAVE SCREEN

Fields:

Leave Type
Start Date
End Date
Duration
Half Day (if allowed)
Reason
Attachment (if required)

UX:

Only eligible leave types appear.

Date validation is immediate.

Balance should be shown.

Policy restrictions should be shown clearly.

Prevent invalid ranges.

Show calculated leave days.

Show weekends/holidays according to project policy.

Do not allow frontend-only validation to be the final authority.

Backend must recalculate and validate everything.

18. REPORTING MANAGER SCREEN

Manager dashboard:

Pending Leave Requests
-----------------------

Employee
Leave Type
Dates
Days
Reason
Balance
Status

[Approve] [Reject]

Manager must only see requests belonging to employees who report to them.

Backend must enforce this.

A user must not gain access by changing URL parameters or request payloads.

19. ADMIN LEAVE CONFIGURATION

Admin/Super Admin UI:

Leave Types

Leave Types
----------------------------------
PL       Privilege Leave    Active
SL       Sick Leave         Active
CL       Casual Leave       Active
ML       Maternity Leave    Active

Actions:

Create
Edit
Activate/Deactivate
View policy

Policy Assignment

Policy
Departments
Eligibility
Accrual
Carry Forward
Effective Date

Admin can assign policies according to department.

20. BACKEND API GUIDELINES

Use the existing API conventions after inspecting the project.

Suggested endpoints:

Employee

GET    /api/leave/types
GET    /api/leave/balances/me
POST   /api/leave/requests
GET    /api/leave/requests/me
GET    /api/leave/requests/me/{id}
PUT    /api/leave/requests/{id}/cancel

Reporting Manager

GET    /api/leave/manager/requests
GET    /api/leave/manager/requests/{id}
PUT    /api/leave/manager/requests/{id}/approve
PUT    /api/leave/manager/requests/{id}/reject

Admin/Super Admin

GET    /api/admin/leave/types
POST   /api/admin/leave/types
PUT    /api/admin/leave/types/{id}
PUT    /api/admin/leave/types/{id}/status

GET    /api/admin/leave/policies
POST   /api/admin/leave/policies
PUT    /api/admin/leave/policies/{id}

POST   /api/admin/leave/policies/{id}/departments
DELETE /api/admin/leave/policies/{id}/departments/{departmentId}

These are examples only.

Do not change existing AdminUserController URLs.

Follow existing project naming conventions and API patterns if they differ.

21. SECURITY

Backend authorization is mandatory.

Examples:

EMPLOYEE:
    create own leave request
    view own requests
    view own balance

REPORTING_MANAGER:
    view subordinate requests
    approve/reject subordinate requests

ADMIN:
    manage leave configuration
    authorized administrative operations

SUPER_ADMIN:
    full leave administration

Prevent:

IDOR

unauthorized leave approval

cross-employee data access

balance manipulation

policy manipulation

gender eligibility bypass

department assignment bypass

Never trust:

employeeId
managerId
departmentId
gender
balance
approvalAuthority

from employee-controlled requests when these can be resolved from authenticated/domain data.

22. TRANSACTION SAFETY

Approval must be transactional.

Conceptually:

BEGIN TRANSACTION

Validate request
Validate manager relationship
Validate leave status
Validate policy
Validate balance
Approve request
Update balance/transactions
Write approval history
Update attendance impact if applicable

COMMIT

If any step fails:

ROLLBACK

Do not leave a request approved while the balance update failed.

Handle concurrent approval attempts safely.

23. VALIDATION RULES

At minimum validate:

Leave type exists and is active

Employee is eligible

Gender eligibility

Department eligibility

Employee is active

Start date <= end date

Leave duration is valid

Half-day rules

Balance availability

Maximum consecutive days

Minimum notice

Backdated rules

Duplicate/overlapping leave

Existing approved leave

Pending overlapping request

Reporting manager relationship

Request belongs to authenticated employee

Request status allows requested action

All critical validation must happen server-side.

24. OVERLAPPING LEAVE

Prevent invalid overlapping requests.

Examples:

Existing approved:
10 Sep - 12 Sep

New request:
11 Sep - 13 Sep

must be rejected unless the business policy explicitly allows it.

Handle half-day overlaps correctly.

25. AUDITABILITY

Important leave actions should be auditable.

Track:

Created

Submitted

Approved

Rejected

Cancelled

Balance adjustment

Accrual

Policy assignment

Policy change

Use existing audit infrastructure if available.

Do not create a duplicate audit framework if the project already has one.

26. ERROR HANDLING

Use the existing global exception handling architecture.

Return consistent API errors.

Do not:

expose stack traces

return raw database exceptions

swallow exceptions

add random try/catch blocks everywhere

Use meaningful validation messages.

27. TESTING REQUIREMENTS

Every phase must include tests relevant to the changes.

Backend tests should cover:

Employee applies leave

Employee cannot apply for another employee

Manager can approve subordinate request

Manager cannot approve unrelated employee request

Admin cannot approve as normal workflow

Gender eligibility

Department eligibility

PL accrual

Joining-date calculation

Duplicate accrual prevention

Balance calculation

Overlap validation

Transaction rollback

Cancellation

Attendance integration

Frontend tests should cover important:

Leave form

Date range selection

Eligibility display

Balance display

Approval actions

Loading/error/empty states

Do not write tests that only assert that components render. Test actual behavior.

28. PHASED IMPLEMENTATION PLAN

PHASE 0 — Repository and Architecture Inspection

Goal

Understand the existing BrewDesk architecture before changing anything.

Kiro must inspect

Backend:

Package structure

Controllers

Services

Repositories

Entities

DTOs

Security configuration

Existing role/authority implementation

User Management

Employee Profile

Department

Reporting Manager relationship

Attendance

Existing global exception handling

Existing audit mechanisms

Database migration strategy

Existing date/time handling

Frontend:

Folder structure

Routing

Authentication

Authorization

Existing components

Existing design system

Existing date/time/calendar components

Existing table/form/modal/toast components

Existing state management

Existing API service pattern

Existing testing setup

Existing UI dependencies

Deliverable

Do NOT modify production code in this phase.

Create an architecture report containing:

Existing relevant files

Existing entities

Existing roles

Existing User Management gender field

Existing employee/department/manager relationships

Existing attendance model

Existing frontend component system

Existing date/time libraries/components

Proposed files to add

Proposed files to modify

Database migration strategy

Risks/conflicts

Recommended implementation sequence

STOP after Phase 0 and wait for approval.

PHASE 1 — Database and Domain Foundation

Implement only the foundational leave domain.

Tasks:

Create required entities

Create repositories

Create enums

Create DTOs

Add migrations

Add indexes/constraints

Connect to existing User/Employee/Department relationships

Reuse existing architecture

Do not build the complete UI yet

Implement:

LeaveType

LeavePolicy

LeavePolicyDepartment

LeaveRequest

LeaveRequestDay if required

EmployeeLeaveBalance

LeaveApprovalHistory

LeaveAccrualTransaction

Add validation and database constraints.

Tests:

Entity/repository tests

Migration verification

Constraint verification

STOP and report files changed + tests.

PHASE 2 — Leave Type and Policy Administration

Implement Admin/Super Admin configuration.

Tasks:

CRUD leave types

Activate/deactivate

Create/update policies

Department assignment

Gender eligibility configuration

Accrual configuration

Policy effective dates

Backend authorization

Important:

Admin/Super Admin can configure leave.

They are NOT added to the normal employee approval workflow.

Tests:

Authorization

CRUD

Department assignment

Gender configuration

Validation

STOP and report.

PHASE 3 — PL Accrual Engine

Implement:

PL = 1.25 days/month

Rules:

Starts from joining date

Handle first-month proration according to configured rule

Monthly accrual

Idempotent

Transaction-safe

Audit transaction

No duplicate monthly accrual

Add service layer such as:

LeaveAccrualService

Use scheduler only if appropriate for existing project architecture.

If a scheduled job is used:

Make it safe to rerun

Do not create duplicate accrual

Log meaningful results

Support failure recovery

Tests must include:

New employee

Mid-month joiner

Multiple months

Duplicate execution

Inactive employee

Missing joining date

Policy inactive

Re-run safety

STOP and report.

PHASE 4 — Employee Leave Experience

Implement employee backend + frontend.

Backend:

Eligible leave types

Own balance

Create request

Own request history

Cancel request where allowed

Eligibility must use:

User Management gender
+
Employee department
+
Leave policy

Frontend:

Leave dashboard

Balance cards

Apply Leave form

Leave history

Calendar

Status badges

Loading/error/empty states

Modernize date/calendar components using the existing project's chosen UI architecture.

STOP and report.

PHASE 5 — Reporting Manager Approval

Implement manager backend + frontend.

Backend:

Get subordinate pending requests

Request details

Approve

Reject

Approval history

Security:

authenticated manager
    ->
request.employee.reportingManagerId

must match.

Do not accept manager ID from frontend as authority.

Approval must:

Validate status

Validate balance

Update balance/transactions

Save approval history

Integrate with attendance where applicable

Run transactionally

Frontend:

Pending requests

Request details

Approve confirmation

Reject dialog with remarks

Success/error feedback

STOP and report.

PHASE 6 — Attendance Integration

Integrate approved leave with Attendance.

Tasks:

Approved leave dates recognized as ON_LEAVE

Prevent false ABSENT

Handle half-day leave

Respect holiday/week-off logic

Preserve attendance history

Avoid duplicate/conflicting attendance records

Inspect the existing attendance architecture before implementing.

Do not rewrite attendance unnecessarily.

Tests:

Full-day leave

Half-day leave

Holiday

Week off

Leave cancellation

Leave approval after attendance generation

Attendance already present

STOP and report.

PHASE 7 — Global Date/Time/Calendar Upgrade

This phase applies to the whole project.

Audit all existing date/time/calendar components.

Update consistently in:

Leave

Attendance

Employee Profile

User Management

Other HR modules

Tasks:

Select one modern compatible date/time strategy

Replace outdated/inconsistent components

Standardize formatting

Standardize timezone handling

Standardize date-only vs timestamp behavior

Improve range selection

Improve calendar UI

Improve accessibility

Prevent timezone/off-by-one bugs

Do not introduce unnecessary libraries.

Regression test existing modules.

STOP and report.

PHASE 8 — Modern Startup UI Polish

Polish the whole Leave module to production quality.

Tasks:

Dashboard

Cards

Tables

Filters

Calendar

Forms

Dialogs

Toasts

Skeleton/loading states

Empty states

Error states

Responsive layout

Mobile behavior

Accessibility

Consistent typography/spacing

Existing design-system integration

Do not redesign unrelated modules unless needed for the global date/calendar modernization.

STOP and report.

PHASE 9 — Edge Cases and Production Hardening

Review:

Concurrent approvals

Duplicate submissions

Overlapping leaves

Balance race conditions

Policy changes

Department changes

Gender changes

Joining-date changes

Inactive users

Leave cancellation

Backdated requests

Half-day

Holiday/weekend

Timezone

Database constraints

Security bypass attempts

Add/fix validation.

STOP and report.

PHASE 10 — Complete Test and Verification

Run:

Backend

Unit tests

Service tests

Repository tests

Controller/security tests

Integration tests

Migration verification

Frontend

Component tests where configured

API integration tests where configured

Build

Lint

Type checking if applicable

Manual verification

Test at least:

1. Create employee/user
2. Assign department
3. Assign gender in User Management
4. Assign leave policy to department
5. Verify eligible leave types
6. Verify Maternity visibility by gender
7. Verify PL accrual
8. Apply leave
9. Verify PENDING
10. Login as Reporting Manager
11. Approve
12. Verify balance
13. Verify attendance ON_LEAVE
14. Verify employee history
15. Test rejection
16. Test cancellation
17. Test unauthorized access
18. Test overlapping leave
19. Test date/time boundaries

Generate a final implementation report.

29. KIRO WORKING RULES

Kiro must follow these rules for every phase:

Inspect before changing.

Work only on the current phase.

Do not implement future phases prematurely.

Do not rewrite working code without a clear reason.

Reuse existing architecture and components.

Do not duplicate User Management gender.

Do not change existing AdminUserController URLs.

Do not create frontend-only authorization.

Enforce all business rules in backend.

Do not trust employee-controlled IDs for authorization.

Use transactions for multi-step business operations.

Add tests with every meaningful backend change.

Do not introduce unnecessary dependencies.

Do not create duplicate frameworks/services.

Keep controllers thin.

Put business logic in services/domain layer.

Keep repositories focused on persistence.

Use DTOs rather than exposing entities directly where the project convention requires DTOs.

Use meaningful exception classes and existing global exception handling.

Keep database migrations versioned.

Do not hardcode leave policy values that should be configurable.

Do not silently change existing behavior outside the scope.

Before modifying shared components, check every module that uses them.

After each phase, provide:

Summary

Files created

Files modified

APIs added/changed

Database changes

Tests added/run

Known issues

Next phase

STOP after each phase and wait for approval.

30. CODE QUALITY STANDARD

Code should be:

Production quality

Clean

SOLID

Layered

Testable

Maintainable

Secure

Transaction-safe

Consistent with existing project conventions

Avoid:

Giant controllers

Business logic in React components

Business logic in controllers

Hardcoded IDs

Hardcoded gender rules in frontend

Hardcoded department mappings

Duplicate gender fields

Duplicate date libraries

Random utility classes

Unnecessary abstractions

Copy-pasted code

Swallowed exceptions

Magic numbers

Frontend-only security

31. DEFINITION OF DONE

The Leave module is complete only when:

Employee can apply for eligible leave

Only Reporting Manager can approve/reject normal employee leave

Admin/Super Admin can configure leave types/policies and department assignment

Gender comes from User Management

Gender eligibility is enforced by backend

Department eligibility is enforced by backend

PL accrues 1.25/month from joining date

PL accrual is idempotent

Leave balances are accurate

Overlapping leave is handled

Approval is transaction-safe

Approval history is recorded

Attendance recognizes approved leave

Modern calendar/date/time components are consistent across the project

UI is modern, responsive and accessible

Backend and frontend tests pass

Existing functionality remains stable

Existing AdminUserController URLs remain unchanged

No unnecessary dependency/framework was introduced

Security rules cannot be bypassed through direct API calls

32. START HERE

Kiro: BEGIN WITH PHASE 0 ONLY.

Do not write implementation code yet.

Inspect the repository and produce the architecture report described in Phase 0.

After the report, STOP and wait for the user to approve Phase 1.

The goal is a production-quality BrewDesk Leave Management system, not a quick frontend prototype.
