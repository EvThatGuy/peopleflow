-- =============================================================================
-- PeopleFlow HR — Demo seed data
-- =============================================================================
-- One organization (Northwind Logistics) with realistic structure:
--   * 5 departments, 4 locations, 12 job titles
--   * 25 employees, 5 of whom are managers (CEO + 4 dept heads)
--   * 4 in onboarding, 2 in offboarding
--   * 6 time-off requests (mix of pending/approved/rejected)
--   * 3 open jobs, 10 candidates across stages
--   * 5 active performance reviews, sample policies, one payroll export
--
-- Run AFTER 0001_init.sql and 0002_rls.sql. This script disables RLS for the
-- seeding session so service-role inserts work cleanly, then re-enables it.
--
-- IMPORTANT: This is for development only. In production, never load fabricated
-- PII into a real tenant — create test orgs explicitly flagged as such.
-- =============================================================================

set role postgres;
alter table organizations            disable row level security;
alter table users                    disable row level security;
alter table memberships              disable row level security;
alter table departments              disable row level security;
alter table locations                disable row level security;
alter table job_titles               disable row level security;
alter table employees                disable row level security;
alter table employment_records       disable row level security;
alter table compensation_records     disable row level security;
alter table policies                 disable row level security;
alter table onboarding_templates     disable row level security;
alter table onboarding_template_tasks disable row level security;
alter table onboarding_tasks         disable row level security;
alter table offboarding_tasks        disable row level security;
alter table pto_policies             disable row level security;
alter table pto_balances             disable row level security;
alter table time_off_requests        disable row level security;
alter table company_holidays         disable row level security;
alter table jobs                     disable row level security;
alter table candidates               disable row level security;
alter table candidate_notes          disable row level security;
alter table interviews               disable row level security;
alter table review_cycles            disable row level security;
alter table performance_reviews      disable row level security;
alter table goals                    disable row level security;
alter table workflows                disable row level security;
alter table workflow_steps           disable row level security;
alter table payroll_exports          disable row level security;
alter table payroll_export_lines     disable row level security;

-- -----------------------------------------------------------------------------
-- Organization
-- -----------------------------------------------------------------------------
with org as (
  insert into organizations (id, name, slug, domain, industry, size_band, country, timezone, plan)
  values (
    '00000000-0000-0000-0000-00000000a001',
    'Northwind Logistics',
    'northwind',
    'northwind.example',
    'Logistics & Supply Chain',
    '51-200',
    'US',
    'America/Chicago',
    'growth'
  )
  returning id
)
select id from org;

-- -----------------------------------------------------------------------------
-- Locations
-- -----------------------------------------------------------------------------
insert into locations (id, organization_id, name, city, state, country, timezone, is_remote) values
  ('00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000a001','HQ — Kansas City','Kansas City','MO','US','America/Chicago',false),
  ('00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000a001','Dallas Hub','Dallas','TX','US','America/Chicago',false),
  ('00000000-0000-0000-0000-00000000b003','00000000-0000-0000-0000-00000000a001','Denver Office','Denver','CO','US','America/Denver',false),
  ('00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000a001','Remote — US','','','US',null,true);

-- -----------------------------------------------------------------------------
-- Departments (head_employee_id wired up after employees insert)
-- -----------------------------------------------------------------------------
insert into departments (id, organization_id, name, description) values
  ('00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000a001','Executive','Leadership & strategy'),
  ('00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000a001','Operations','Warehouses, dispatch, fulfillment'),
  ('00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000a001','Engineering','Platform, internal tools'),
  ('00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000a001','Sales','Enterprise sales & accounts'),
  ('00000000-0000-0000-0000-00000000c005','00000000-0000-0000-0000-00000000a001','People','HR, recruiting, talent');

-- -----------------------------------------------------------------------------
-- Job titles
-- -----------------------------------------------------------------------------
insert into job_titles (id, organization_id, name, job_family, level) values
  ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000a001','Chief Executive Officer','Executive','C-Suite'),
  ('00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-00000000a001','VP Operations','Operations','VP'),
  ('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-00000000a001','VP Engineering','Engineering','VP'),
  ('00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-00000000a001','VP Sales','Sales','VP'),
  ('00000000-0000-0000-0000-00000000d005','00000000-0000-0000-0000-00000000a001','Head of People','People','Director'),
  ('00000000-0000-0000-0000-00000000d006','00000000-0000-0000-0000-00000000a001','Operations Lead','Operations','Senior'),
  ('00000000-0000-0000-0000-00000000d007','00000000-0000-0000-0000-00000000a001','Operations Specialist','Operations','Mid'),
  ('00000000-0000-0000-0000-00000000d008','00000000-0000-0000-0000-00000000a001','Senior Software Engineer','Engineering','Senior'),
  ('00000000-0000-0000-0000-00000000d009','00000000-0000-0000-0000-00000000a001','Software Engineer','Engineering','Mid'),
  ('00000000-0000-0000-0000-00000000d010','00000000-0000-0000-0000-00000000a001','Account Executive','Sales','Mid'),
  ('00000000-0000-0000-0000-00000000d011','00000000-0000-0000-0000-00000000a001','Sales Development Rep','Sales','Junior'),
  ('00000000-0000-0000-0000-00000000d012','00000000-0000-0000-0000-00000000a001','HR Business Partner','People','Senior'),
  ('00000000-0000-0000-0000-00000000d013','00000000-0000-0000-0000-00000000a001','Recruiter','People','Mid');

-- -----------------------------------------------------------------------------
-- Employees
-- 5 managers + 20 ICs = 25 active. 4 onboarding (pending_start). 2 offboarding.
-- We use deterministic UUIDs for easy reference downstream.
-- -----------------------------------------------------------------------------
-- Managers / leaders (1-5)
insert into employees (id, organization_id, employee_number, preferred_first_name, legal_first_name, legal_last_name,
                       email_work, status, hired_at, start_date, manager_id, department_id, location_id, job_title_id, employment_type)
values
  ('00000000-0000-0000-0000-00000000e001','00000000-0000-0000-0000-00000000a001','E-1001','Marina','Marina','Vasquez',
   'marina.vasquez@northwind.example','active','2018-03-01','2018-03-01',null,
   '00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d001','full_time'),

  ('00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000a001','E-1002','Tomas','Tomas','Brennan',
   'tomas.brennan@northwind.example','active','2019-08-12','2019-08-12','00000000-0000-0000-0000-00000000e001',
   '00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d002','full_time'),

  ('00000000-0000-0000-0000-00000000e003','00000000-0000-0000-0000-00000000a001','E-1003','Priya','Priya','Sundaram',
   'priya.sundaram@northwind.example','active','2020-01-06','2020-01-06','00000000-0000-0000-0000-00000000e001',
   '00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d003','full_time'),

  ('00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000a001','E-1004','Devon','Devon','Okafor',
   'devon.okafor@northwind.example','active','2020-09-14','2020-09-14','00000000-0000-0000-0000-00000000e001',
   '00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d004','full_time'),

  ('00000000-0000-0000-0000-00000000e005','00000000-0000-0000-0000-00000000a001','E-1005','Renata','Renata','Kohl',
   'renata.kohl@northwind.example','active','2021-04-19','2021-04-19','00000000-0000-0000-0000-00000000e001',
   '00000000-0000-0000-0000-00000000c005','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d005','full_time');

-- Operations team (6-12)
insert into employees (id, organization_id, employee_number, preferred_first_name, legal_first_name, legal_last_name,
                       email_work, status, hired_at, start_date, manager_id, department_id, location_id, job_title_id, employment_type)
values
  ('00000000-0000-0000-0000-00000000e006','00000000-0000-0000-0000-00000000a001','E-1006','Hector','Hector','Lin','hector.lin@northwind.example','active','2021-06-22','2021-06-22','00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d006','full_time'),
  ('00000000-0000-0000-0000-00000000e007','00000000-0000-0000-0000-00000000a001','E-1007','Aisha','Aisha','Patel','aisha.patel@northwind.example','active','2022-02-14','2022-02-14','00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d007','full_time'),
  ('00000000-0000-0000-0000-00000000e008','00000000-0000-0000-0000-00000000a001','E-1008','Marcus','Marcus','DeLeon','marcus.deleon@northwind.example','active','2022-05-03','2022-05-03','00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b003','00000000-0000-0000-0000-00000000d007','full_time'),
  ('00000000-0000-0000-0000-00000000e009','00000000-0000-0000-0000-00000000a001','E-1009','Yuki','Yuki','Tanaka','yuki.tanaka@northwind.example','active','2022-11-08','2022-11-08','00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d007','full_time'),
  ('00000000-0000-0000-0000-00000000e010','00000000-0000-0000-0000-00000000a001','E-1010','Lewis','Lewis','Aboagye','lewis.aboagye@northwind.example','on_leave','2021-09-01','2021-09-01','00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d007','full_time'),
  ('00000000-0000-0000-0000-00000000e011','00000000-0000-0000-0000-00000000a001','E-1011','Sasha','Sasha','Mendez','sasha.mendez@northwind.example','active','2023-03-20','2023-03-20','00000000-0000-0000-0000-00000000e006','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d007','full_time'),
  ('00000000-0000-0000-0000-00000000e012','00000000-0000-0000-0000-00000000a001','E-1012','Ben','Benjamin','Ortega','ben.ortega@northwind.example','active','2023-07-11','2023-07-11','00000000-0000-0000-0000-00000000e006','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b003','00000000-0000-0000-0000-00000000d007','full_time');

-- Engineering team (13-18)
insert into employees (id, organization_id, employee_number, preferred_first_name, legal_first_name, legal_last_name,
                       email_work, status, hired_at, start_date, manager_id, department_id, location_id, job_title_id, employment_type)
values
  ('00000000-0000-0000-0000-00000000e013','00000000-0000-0000-0000-00000000a001','E-1013','Naomi','Naomi','Garcia','naomi.garcia@northwind.example','active','2021-11-15','2021-11-15','00000000-0000-0000-0000-00000000e003','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d008','full_time'),
  ('00000000-0000-0000-0000-00000000e014','00000000-0000-0000-0000-00000000a001','E-1014','Felix','Felix','Mwangi','felix.mwangi@northwind.example','active','2022-01-24','2022-01-24','00000000-0000-0000-0000-00000000e003','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d008','full_time'),
  ('00000000-0000-0000-0000-00000000e015','00000000-0000-0000-0000-00000000a001','E-1015','Iris','Iris','Petersen','iris.petersen@northwind.example','active','2023-02-06','2023-02-06','00000000-0000-0000-0000-00000000e003','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d009','full_time'),
  ('00000000-0000-0000-0000-00000000e016','00000000-0000-0000-0000-00000000a001','E-1016','Wren','Wren','Holloway','wren.holloway@northwind.example','active','2023-08-28','2023-08-28','00000000-0000-0000-0000-00000000e013','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d009','full_time'),
  ('00000000-0000-0000-0000-00000000e017','00000000-0000-0000-0000-00000000a001','E-1017','Diego','Diego','Cardona','diego.cardona@northwind.example','active','2024-04-15','2024-04-15','00000000-0000-0000-0000-00000000e013','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d009','full_time'),
  ('00000000-0000-0000-0000-00000000e018','00000000-0000-0000-0000-00000000a001','E-1018','Stella','Stella','Bauer','stella.bauer@northwind.example','active','2024-09-09','2024-09-09','00000000-0000-0000-0000-00000000e013','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d009','full_time');

-- Sales team (19-22)
insert into employees (id, organization_id, employee_number, preferred_first_name, legal_first_name, legal_last_name,
                       email_work, status, hired_at, start_date, manager_id, department_id, location_id, job_title_id, employment_type)
values
  ('00000000-0000-0000-0000-00000000e019','00000000-0000-0000-0000-00000000a001','E-1019','Kenji','Kenji','Okada','kenji.okada@northwind.example','active','2022-06-13','2022-06-13','00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d010','full_time'),
  ('00000000-0000-0000-0000-00000000e020','00000000-0000-0000-0000-00000000a001','E-1020','Camille','Camille','Robinson','camille.robinson@northwind.example','active','2023-01-30','2023-01-30','00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d010','full_time'),
  ('00000000-0000-0000-0000-00000000e021','00000000-0000-0000-0000-00000000a001','E-1021','Theo','Theodore','Ramirez','theo.ramirez@northwind.example','active','2023-10-02','2023-10-02','00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d011','full_time'),
  ('00000000-0000-0000-0000-00000000e022','00000000-0000-0000-0000-00000000a001','E-1022','Mara','Mara','Sokolova','mara.sokolova@northwind.example','active','2024-05-21','2024-05-21','00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d011','full_time');

-- People team (23-25)
insert into employees (id, organization_id, employee_number, preferred_first_name, legal_first_name, legal_last_name,
                       email_work, status, hired_at, start_date, manager_id, department_id, location_id, job_title_id, employment_type)
values
  ('00000000-0000-0000-0000-00000000e023','00000000-0000-0000-0000-00000000a001','E-1023','Lila','Lila','Ferrari','lila.ferrari@northwind.example','active','2022-08-29','2022-08-29','00000000-0000-0000-0000-00000000e005','00000000-0000-0000-0000-00000000c005','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d012','full_time'),
  ('00000000-0000-0000-0000-00000000e024','00000000-0000-0000-0000-00000000a001','E-1024','Owen','Owen','Khattak','owen.khattak@northwind.example','active','2023-12-04','2023-12-04','00000000-0000-0000-0000-00000000e005','00000000-0000-0000-0000-00000000c005','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d013','full_time'),
  ('00000000-0000-0000-0000-00000000e025','00000000-0000-0000-0000-00000000a001','E-1025','Greta','Greta','Halonen','greta.halonen@northwind.example','active','2024-07-15','2024-07-15','00000000-0000-0000-0000-00000000e005','00000000-0000-0000-0000-00000000c005','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d013','full_time');

-- Onboarding (4) — pending_start, future start dates
insert into employees (id, organization_id, employee_number, preferred_first_name, legal_first_name, legal_last_name,
                       email_work, status, hired_at, start_date, manager_id, department_id, location_id, job_title_id, employment_type)
values
  ('00000000-0000-0000-0000-00000000e026','00000000-0000-0000-0000-00000000a001','E-1026','Jasper','Jasper','Nakamura','jasper.nakamura@northwind.example','pending_start',current_date - 7,current_date + 7,'00000000-0000-0000-0000-00000000e003','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d009','full_time'),
  ('00000000-0000-0000-0000-00000000e027','00000000-0000-0000-0000-00000000a001','E-1027','Nora','Nora','Westerlund','nora.westerlund@northwind.example','pending_start',current_date - 4,current_date + 14,'00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d010','full_time'),
  ('00000000-0000-0000-0000-00000000e028','00000000-0000-0000-0000-00000000a001','E-1028','Cyrus','Cyrus','Adair','cyrus.adair@northwind.example','pending_start',current_date - 1,current_date + 21,'00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d007','full_time'),
  ('00000000-0000-0000-0000-00000000e029','00000000-0000-0000-0000-00000000a001','E-1029','Aria','Aria','Bellini','aria.bellini@northwind.example','pending_start',current_date,current_date + 28,'00000000-0000-0000-0000-00000000e003','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d009','full_time');

-- Offboarding (2) — currently in offboarding
insert into employees (id, organization_id, employee_number, preferred_first_name, legal_first_name, legal_last_name,
                       email_work, status, hired_at, start_date, termination_date, manager_id, department_id, location_id, job_title_id, employment_type, is_eligible_for_rehire)
values
  ('00000000-0000-0000-0000-00000000e030','00000000-0000-0000-0000-00000000a001','E-1030','Quinn','Quinn','Voss','quinn.voss@northwind.example','offboarding','2022-04-04','2022-04-04',current_date + 14,'00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000d011','full_time',true),
  ('00000000-0000-0000-0000-00000000e031','00000000-0000-0000-0000-00000000a001','E-1031','Sander','Sander','Klein','sander.klein@northwind.example','offboarding','2021-12-13','2021-12-13',current_date + 7,'00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d007','full_time',true);

-- Wire department heads now that employees exist
update departments set head_employee_id = '00000000-0000-0000-0000-00000000e001' where id = '00000000-0000-0000-0000-00000000c001';
update departments set head_employee_id = '00000000-0000-0000-0000-00000000e002' where id = '00000000-0000-0000-0000-00000000c002';
update departments set head_employee_id = '00000000-0000-0000-0000-00000000e003' where id = '00000000-0000-0000-0000-00000000c003';
update departments set head_employee_id = '00000000-0000-0000-0000-00000000e004' where id = '00000000-0000-0000-0000-00000000c004';
update departments set head_employee_id = '00000000-0000-0000-0000-00000000e005' where id = '00000000-0000-0000-0000-00000000c005';

-- -----------------------------------------------------------------------------
-- Compensation (sample subset — every active employee in production)
-- -----------------------------------------------------------------------------
insert into compensation_records (organization_id, employee_id, pay_basis, base_amount, currency, pay_frequency, bonus_target_pct, effective_from, change_reason) values
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e001','salary',285000,'USD','semimonthly',40,'2024-01-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e002','salary',195000,'USD','semimonthly',25,'2024-01-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e003','salary',210000,'USD','semimonthly',25,'2024-01-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e004','salary',215000,'USD','semimonthly',30,'2024-01-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e005','salary',175000,'USD','semimonthly',20,'2024-01-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e013','salary',165000,'USD','semimonthly',15,'2024-04-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e014','salary',155000,'USD','semimonthly',15,'2024-04-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e015','salary',125000,'USD','semimonthly',10,'2024-04-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e019','salary',110000,'USD','semimonthly',50,'2024-01-01','merit'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e020','salary',108000,'USD','semimonthly',50,'2024-01-01','merit');

-- -----------------------------------------------------------------------------
-- PTO policies + balances (vacation + sick for everyone active)
-- -----------------------------------------------------------------------------
insert into pto_policies (id, organization_id, name, kind, accrual_method, annual_hours, carryover_max_hours, is_paid) values
  ('00000000-0000-0000-0000-00000000f001','00000000-0000-0000-0000-00000000a001','Standard Vacation','vacation','annual_grant',160,40,true),
  ('00000000-0000-0000-0000-00000000f002','00000000-0000-0000-0000-00000000a001','Sick Leave','sick','annual_grant',80,80,true);

insert into pto_balances (organization_id, employee_id, policy_id, balance_hours, used_hours, pending_hours)
select '00000000-0000-0000-0000-00000000a001', e.id, '00000000-0000-0000-0000-00000000f001',
       round((random()*120 + 40)::numeric, 1), round((random()*40)::numeric, 1), 0
  from employees e where e.status = 'active';

insert into pto_balances (organization_id, employee_id, policy_id, balance_hours, used_hours, pending_hours)
select '00000000-0000-0000-0000-00000000a001', e.id, '00000000-0000-0000-0000-00000000f002',
       round((random()*60 + 20)::numeric, 1), round((random()*20)::numeric, 1), 0
  from employees e where e.status = 'active';

-- -----------------------------------------------------------------------------
-- Time off requests (6, mixed statuses)
-- -----------------------------------------------------------------------------
insert into time_off_requests (organization_id, employee_id, policy_id, kind, starts_on, ends_on, hours_requested, reason, status, reviewed_at) values
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e007','00000000-0000-0000-0000-00000000f001','vacation', current_date + 10, current_date + 14, 32, 'Family vacation','pending',null),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e011','00000000-0000-0000-0000-00000000f001','vacation', current_date + 21, current_date + 25, 32, 'Wedding','pending',null),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e016','00000000-0000-0000-0000-00000000f002','sick', current_date - 2, current_date - 1, 16, 'Flu','approved', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e019','00000000-0000-0000-0000-00000000f001','vacation', current_date + 30, current_date + 34, 32, 'Long weekend','approved', now() - interval '4 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e021','00000000-0000-0000-0000-00000000f001','vacation', current_date + 5, current_date + 12, 56, 'Honeymoon','pending',null),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000e024','00000000-0000-0000-0000-00000000f001','personal', current_date + 3, current_date + 3, 8, 'Personal day','rejected', now() - interval '2 days');

-- -----------------------------------------------------------------------------
-- Onboarding template + tasks for new hires
-- -----------------------------------------------------------------------------
insert into onboarding_templates (id, organization_id, name, description, is_default) values
  ('00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-00000000a001','Standard New Hire','Default 30-day onboarding for full-time hires',true);

insert into onboarding_template_tasks (template_id, title, category, assignee_role, due_offset_days, ordinal) values
  ('00000000-0000-0000-0000-000000010001','Sign offer letter','paperwork','new_hire',-7,1),
  ('00000000-0000-0000-0000-000000010001','Complete I-9 verification','paperwork','new_hire',1,2),
  ('00000000-0000-0000-0000-000000010001','Submit direct deposit form','paperwork','new_hire',2,3),
  ('00000000-0000-0000-0000-000000010001','Provision laptop & monitor','equipment','it',-3,4),
  ('00000000-0000-0000-0000-000000010001','Create email & SSO accounts','accounts','it',-1,5),
  ('00000000-0000-0000-0000-000000010001','Add to team Slack channels','accounts','it',1,6),
  ('00000000-0000-0000-0000-000000010001','Schedule 30-day check-in','intro','manager',7,7),
  ('00000000-0000-0000-0000-000000010001','Welcome lunch with team','intro','manager',2,8),
  ('00000000-0000-0000-0000-000000010001','Complete security training','training','new_hire',7,9),
  ('00000000-0000-0000-0000-000000010001','Read employee handbook','training','new_hire',5,10);

-- Materialize tasks for the 4 onboarding employees
insert into onboarding_tasks (organization_id, employee_id, title, category, due_date, status)
select '00000000-0000-0000-0000-00000000a001', e.id, t.title, t.category, e.start_date + t.due_offset_days,
       case when random() < 0.3 then 'completed'::onboarding_task_status
            when random() < 0.5 then 'in_progress'::onboarding_task_status
            else 'not_started'::onboarding_task_status end
  from employees e
 cross join onboarding_template_tasks t
 where e.status = 'pending_start' and t.template_id = '00000000-0000-0000-0000-000000010001';

-- -----------------------------------------------------------------------------
-- Offboarding tasks for the 2 offboarding employees
-- -----------------------------------------------------------------------------
insert into offboarding_tasks (organization_id, employee_id, title, category, due_date, status)
select '00000000-0000-0000-0000-00000000a001', e.id, x.title, x.category, e.termination_date - x.offset, 'not_started'
  from employees e,
  (values
    ('Conduct exit interview','exit_interview',5),
    ('Return company laptop','equipment_return',1),
    ('Revoke email & SSO access','access_removal',0),
    ('Revoke building access','access_removal',0),
    ('Process final paycheck','final_pay',-3),
    ('Issue COBRA paperwork','documents',-7)
  ) x(title, category, offset)
 where e.status = 'offboarding';

-- -----------------------------------------------------------------------------
-- Open jobs (3)
-- -----------------------------------------------------------------------------
insert into jobs (id, organization_id, title, department_id, location_id, job_title_id, employment_type, description_md, salary_min, salary_max, status, hiring_manager_id, recruiter_id, posted_at) values
  ('00000000-0000-0000-0000-000000020001','00000000-0000-0000-0000-00000000a001','Senior Software Engineer, Platform','00000000-0000-0000-0000-00000000c003','00000000-0000-0000-0000-00000000b004','00000000-0000-0000-0000-00000000d008','full_time','Build the foundational systems that power our logistics platform.',155000,195000,'open','00000000-0000-0000-0000-00000000e003','00000000-0000-0000-0000-00000000e024',now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000020002','00000000-0000-0000-0000-00000000a001','Account Executive, Mid-Market','00000000-0000-0000-0000-00000000c004','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000d010','full_time','Own the full sales cycle for mid-market logistics customers.',95000,125000,'open','00000000-0000-0000-0000-00000000e004','00000000-0000-0000-0000-00000000e025',now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000020003','00000000-0000-0000-0000-00000000a001','Operations Specialist','00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000b003','00000000-0000-0000-0000-00000000d007','full_time','Coordinate dispatch and fulfillment from our Denver office.',58000,72000,'open','00000000-0000-0000-0000-00000000e002','00000000-0000-0000-0000-00000000e025',now() - interval '3 days');

-- -----------------------------------------------------------------------------
-- Candidates (10) across stages
-- -----------------------------------------------------------------------------
insert into candidates (organization_id, job_id, first_name, last_name, email, source, stage, rating, applied_at) values
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020001','Aurora','Wakefield','aurora.w@example.com','linkedin','final_round',5, now() - interval '10 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020001','Bram','Holstein','bram.h@example.com','referral','interview',4, now() - interval '8 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020001','Carmen','Lindholm','carmen.l@example.com','careers_site','phone_screen',null, now() - interval '5 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020001','Davis','Pereira','davis.p@example.com','linkedin','applied',null, now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020002','Elena','Roussakis','elena.r@example.com','linkedin','offer_extended',5, now() - interval '12 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020002','Fynn','Carrasco','fynn.c@example.com','referral','interview',4, now() - interval '7 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020002','Gianna','Beaumont','gianna.b@example.com','indeed','screening',null, now() - interval '4 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020003','Hugo','Stenberg','hugo.s@example.com','careers_site','phone_screen',3, now() - interval '5 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020003','Ines','Markov','ines.m@example.com','linkedin','applied',null, now() - interval '3 days'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000020003','Jonas','Petrenko','jonas.p@example.com','referral','rejected',2, now() - interval '9 days');

-- -----------------------------------------------------------------------------
-- Performance reviews (5 in progress for current cycle)
-- -----------------------------------------------------------------------------
insert into review_cycles (id, organization_id, name, starts_on, ends_on) values
  ('00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-00000000a001','Q4 2025 Performance Review', current_date - 14, current_date + 21);

insert into performance_reviews (organization_id, cycle_id, employee_id, reviewer_id, status) values
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-00000000e007','00000000-0000-0000-0000-00000000e002','in_progress'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-00000000e013','00000000-0000-0000-0000-00000000e003','submitted'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-00000000e015','00000000-0000-0000-0000-00000000e003','in_progress'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-00000000e019','00000000-0000-0000-0000-00000000e004','not_started'),
  ('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-00000000e023','00000000-0000-0000-0000-00000000e005','submitted');

-- -----------------------------------------------------------------------------
-- Sample policies
-- -----------------------------------------------------------------------------
insert into policies (organization_id, title, slug, body_md, version, effective_from, acknowledgment_required) values
  ('00000000-0000-0000-0000-00000000a001','Employee Handbook','employee-handbook',
   '# Northwind Logistics Employee Handbook' || E'\n\n' ||
   'Welcome. This handbook describes how we work, what we expect, and what you can expect from us.' || E'\n\n' ||
   '## Our Values' || E'\n' ||
   '1. Take care of the team. 2. Take care of the customer. 3. Tell the truth.',
   1, current_date - 365, true),
  ('00000000-0000-0000-0000-00000000a001','Code of Conduct','code-of-conduct',
   '# Code of Conduct' || E'\n\n' ||
   'We treat each other with respect. Harassment of any kind is not tolerated. Report concerns to People at people@northwind.example.',
   1, current_date - 365, true),
  ('00000000-0000-0000-0000-00000000a001','Remote Work Policy','remote-work',
   '# Remote Work' || E'\n\n' ||
   'Most roles support hybrid or fully remote work within the United States. Discuss specific arrangements with your manager.',
   2, current_date - 90, false),
  ('00000000-0000-0000-0000-00000000a001','PTO & Time Off Policy','pto-policy',
   '# PTO Policy' || E'\n\n' ||
   'Full-time employees receive 160 hours of paid vacation per year, plus 80 hours of sick leave. Time off is accrued annually on January 1.',
   1, current_date - 180, true);

-- -----------------------------------------------------------------------------
-- Company holidays
-- -----------------------------------------------------------------------------
insert into company_holidays (organization_id, name, observed_on) values
  ('00000000-0000-0000-0000-00000000a001','New Years Day', date_trunc('year', current_date)::date),
  ('00000000-0000-0000-0000-00000000a001','Memorial Day', date_trunc('year', current_date)::date + interval '4 months 27 days'),
  ('00000000-0000-0000-0000-00000000a001','Independence Day', date_trunc('year', current_date)::date + interval '6 months 3 days'),
  ('00000000-0000-0000-0000-00000000a001','Labor Day', date_trunc('year', current_date)::date + interval '8 months 1 day'),
  ('00000000-0000-0000-0000-00000000a001','Thanksgiving', date_trunc('year', current_date)::date + interval '10 months 26 days'),
  ('00000000-0000-0000-0000-00000000a001','Christmas Day', date_trunc('year', current_date)::date + interval '11 months 24 days');

-- -----------------------------------------------------------------------------
-- One sample payroll export
-- -----------------------------------------------------------------------------
insert into payroll_exports (id, organization_id, pay_period_start, pay_period_end, pay_date, destination, status, export_format) values
  ('00000000-0000-0000-0000-000000040001','00000000-0000-0000-0000-00000000a001', current_date - 14, current_date - 1, current_date + 2, 'gusto', 'draft', 'csv');

insert into payroll_export_lines (export_id, employee_id, regular_hours, overtime_hours, pto_hours, gross_amount)
select '00000000-0000-0000-0000-000000040001', e.id, 80, 0, 0,
       case when random() < 0.5 then round((random()*4000+2500)::numeric,2) else round((random()*8000+5000)::numeric,2) end
  from employees e where e.status in ('active','on_leave') limit 25;

-- -----------------------------------------------------------------------------
-- Workflows: 2 time-off pending, 1 comp change in review
-- -----------------------------------------------------------------------------
insert into workflows (organization_id, kind, subject_type, subject_id, status, current_step)
select '00000000-0000-0000-0000-00000000a001','time_off','time_off_request', tor.id, 'in_review', 1
  from time_off_requests tor
 where tor.status = 'pending'
 limit 2;

-- -----------------------------------------------------------------------------
-- Re-enable RLS
-- -----------------------------------------------------------------------------
alter table organizations            enable row level security;
alter table users                    enable row level security;
alter table memberships              enable row level security;
alter table departments              enable row level security;
alter table locations                enable row level security;
alter table job_titles               enable row level security;
alter table employees                enable row level security;
alter table employment_records       enable row level security;
alter table compensation_records     enable row level security;
alter table policies                 enable row level security;
alter table onboarding_templates     enable row level security;
alter table onboarding_template_tasks enable row level security;
alter table onboarding_tasks         enable row level security;
alter table offboarding_tasks        enable row level security;
alter table pto_policies             enable row level security;
alter table pto_balances             enable row level security;
alter table time_off_requests        enable row level security;
alter table company_holidays         enable row level security;
alter table jobs                     enable row level security;
alter table candidates               enable row level security;
alter table candidate_notes          enable row level security;
alter table interviews               enable row level security;
alter table review_cycles            enable row level security;
alter table performance_reviews      enable row level security;
alter table goals                    enable row level security;
alter table workflows                enable row level security;
alter table workflow_steps           enable row level security;
alter table payroll_exports          enable row level security;
alter table payroll_export_lines     enable row level security;
