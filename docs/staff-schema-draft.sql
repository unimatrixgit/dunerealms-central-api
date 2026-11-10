-- DESIGN-ONLY MIGRATION: do not run against production without adapting to the
-- deployed DuneHub database engine, schema and deployment migration framework.
-- Website ranks remain in cp_ranks / site_accounts; no changes to those tables.
-- The application must enforce actor permissions, owner protection and audit logging.
CREATE TABLE IF NOT EXISTS staff_departments (
 department_key VARCHAR(40) PRIMARY KEY,
 label VARCHAR(80) NOT NULL,
 parent_key VARCHAR(40) NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 FOREIGN KEY (parent_key) REFERENCES staff_departments(department_key)
);
CREATE TABLE IF NOT EXISTS staff_department_memberships (
 account_id VARCHAR(64) NOT NULL,
 department_key VARCHAR(40) NOT NULL,
 team_key VARCHAR(40) NOT NULL,
 title VARCHAR(80) NOT NULL,
 is_lead BOOLEAN NOT NULL DEFAULT FALSE,
 PRIMARY KEY(account_id,department_key,team_key),
 FOREIGN KEY (department_key) REFERENCES staff_departments(department_key)
);
CREATE TABLE IF NOT EXISTS staff_rank_game_groups (
 website_rank VARCHAR(40) NOT NULL,
 minecraft_group VARCHAR(40) NOT NULL,
 PRIMARY KEY(website_rank,minecraft_group)
);
-- Application must maintain a version/optimistic concurrency token for group mappings,
-- check allowed Minecraft group catalog, and audit every mapping change.
-- Do not treat department membership as an authorization grant.
