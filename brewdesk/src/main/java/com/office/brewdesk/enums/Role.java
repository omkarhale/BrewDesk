package com.office.brewdesk.enums;

/**
 * BrewDesk user roles — ordered from highest to lowest privilege.
 *
 * SUPER_ADMIN        : System owner. Full access to everything including user management.
 * ADMIN              : HR / Office admin. Manages employees, attendance, pantry config.
 * REPORTING_MANAGER  : Team lead. Views own team's attendance, approves regularizations.
 * CHEF               : Pantry operator (formerly MAKER). Extra pantry powers + own attendance.
 * EMPLOYEE           : Regular staff. Own attendance + pantry ordering.
 *
 * NOTE: The database column stores the enum name as a STRING.
 * Existing MAKER rows in the DB must be migrated to CHEF via SQL before deploying.
 * Migration script: UPDATE users SET role = 'CHEF' WHERE role = 'MAKER';
 */
public enum Role {
    SUPER_ADMIN,
    ADMIN,
    REPORTING_MANAGER,
    CHEF,
    EMPLOYEE
}
