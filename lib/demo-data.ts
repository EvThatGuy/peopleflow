/**
 * In-memory demo data that mirrors `supabase/seed/seed.sql`.
 *
 * This module exists so the prototype renders meaningfully without a configured
 * Supabase project. Every page that reads data from here is also a place where
 * a real Supabase query should live in production.
 *
 * To wire to live data:
 *   1. Replace each `getXxx()` call with a Supabase RSC query against the
 *      tables in supabase/migrations/0001_init.sql.
 *   2. Filter by session.organizationId; RLS will enforce tenant isolation.
 *   3. Use `createClient()` from `lib/supabase/server` to honor RLS.
 *
 * IDs here intentionally match the seed file so a hybrid mode (some live, some
 * demo) is also possible while iterating.
 */

export type Department = {
  id: string;
  code: string;
  name: string;
  headcount: number;
};

export type Location = {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
};

export type EmploymentStatus = 'active' | 'pending_start' | 'on_leave' | 'offboarding' | 'terminated';

export type Employee = {
  id: string;
  fullName: string;
  preferredName: string | null;
  email: string;
  phone?: string;
  jobTitle: string;
  jobLevel: string;
  departmentId: string;
  departmentName: string;
  locationId: string;
  locationName: string;
  managerId: string | null;
  managerName: string | null;
  startDate: string;
  status: EmploymentStatus;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  /** Compensation visible only to HR + self (RLS-enforced in production) */
  compensation?: {
    base: number;
    currency: string;
    payBasis: 'salary' | 'hourly';
    payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  };
  pronouns?: string;
};

export type TimeOffRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  kind: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'parental' | 'unpaid';
  startDate: string;
  endDate: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  note?: string;
  submittedAt: string;
  approverId?: string;
};

export type Job = {
  id: string;
  title: string;
  departmentName: string;
  locationName: string;
  status: 'open' | 'on_hold' | 'closed';
  candidates: number;
  postedAt: string;
};

export type Candidate = {
  id: string;
  fullName: string;
  email: string;
  jobId: string;
  jobTitle: string;
  stage: 'applied' | 'screen' | 'interviewing' | 'final_round' | 'offer_extended' | 'hired' | 'rejected';
  appliedAt: string;
  rating: number | null;
};

export type OnboardingTask = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  category: 'paperwork' | 'equipment' | 'accounts' | 'training' | 'intro';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  assigneeRole: 'hr' | 'manager' | 'employee' | 'it';
  dueDate: string;
};

export type Activity = {
  id: string;
  at: string;
  who: string;
  action: string;
  subject?: string;
  kind: 'time_off' | 'onboarding' | 'document' | 'review' | 'job' | 'candidate' | 'compensation';
};

// =============================================================================
// DEPARTMENTS
// =============================================================================
export const departments: Department[] = [
  { id: 'd1', code: 'EXEC', name: 'Executive', headcount: 1 },
  { id: 'd2', code: 'OPS', name: 'Operations', headcount: 9 },
  { id: 'd3', code: 'ENG', name: 'Engineering', headcount: 8 },
  { id: 'd4', code: 'SALES', name: 'Sales', headcount: 6 },
  { id: 'd5', code: 'PEOPLE', name: 'People', headcount: 3 },
];

// =============================================================================
// LOCATIONS
// =============================================================================
export const locations: Location[] = [
  { id: 'l1', name: 'Kansas City HQ', city: 'Kansas City', region: 'MO', country: 'US' },
  { id: 'l2', name: 'Dallas', city: 'Dallas', region: 'TX', country: 'US' },
  { id: 'l3', name: 'Denver', city: 'Denver', region: 'CO', country: 'US' },
  { id: 'l4', name: 'Remote — US', city: 'Remote', region: '', country: 'US' },
];

// =============================================================================
// EMPLOYEES — 31 total: 25 active, 4 pending_start, 2 offboarding
// =============================================================================
const E = (
  id: string,
  fullName: string,
  preferredName: string | null,
  email: string,
  jobTitle: string,
  jobLevel: string,
  deptId: string,
  locationId: string,
  managerId: string | null,
  startDate: string,
  status: EmploymentStatus,
  base: number | null,
  payBasis: 'salary' | 'hourly' = 'salary',
  employmentType: Employee['employmentType'] = 'full_time',
): Employee => {
  const dept = departments.find((d) => d.id === deptId)!;
  const loc = locations.find((l) => l.id === locationId)!;
  return {
    id,
    fullName,
    preferredName,
    email,
    jobTitle,
    jobLevel,
    departmentId: deptId,
    departmentName: dept.name,
    locationId,
    locationName: loc.name,
    managerId,
    managerName: null, // resolved below
    startDate,
    status,
    employmentType,
    compensation: base
      ? {
          base,
          currency: 'USD',
          payBasis,
          payFrequency: payBasis === 'salary' ? 'biweekly' : 'biweekly',
        }
      : undefined,
  };
};

export const employees: Employee[] = [
  // Leadership
  E('e001', 'Marina Vasquez', 'Marina', 'marina.vasquez@northwind.example', 'Chief Executive Officer', 'C-Level', 'd1', 'l1', null, '2018-03-12', 'active', 285000),
  E('e002', 'David Okafor', 'David', 'david.okafor@northwind.example', 'VP of Operations', 'VP', 'd2', 'l1', 'e001', '2019-01-08', 'active', 215000),
  E('e003', 'Priya Raman', 'Priya', 'priya.raman@northwind.example', 'VP of Engineering', 'VP', 'd3', 'l4', 'e001', '2019-06-21', 'active', 235000),
  E('e004', 'Jonas Lindqvist', 'Jonas', 'jonas.lindqvist@northwind.example', 'VP of Sales', 'VP', 'd4', 'l2', 'e001', '2020-02-18', 'active', 220000),
  E('e005', 'Aisha Bello', 'Aisha', 'aisha.bello@northwind.example', 'Head of People', 'Director', 'd5', 'l1', 'e001', '2020-09-14', 'active', 168000),

  // Operations team — reports to David (e002)
  E('e006', 'Rafael Mendoza', 'Rafa', 'rafael.mendoza@northwind.example', 'Operations Manager', 'M2', 'd2', 'l1', 'e002', '2021-04-05', 'active', 132000),
  E('e007', 'Hannah Klein', 'Hannah', 'hannah.klein@northwind.example', 'Logistics Lead', 'IC4', 'd2', 'l2', 'e006', '2022-01-17', 'active', 102000),
  E('e008', 'Tomás Aguilar', 'Tomás', 'tomas.aguilar@northwind.example', 'Operations Specialist', 'IC3', 'd2', 'l1', 'e006', '2022-08-22', 'active', 78000),
  E('e009', 'Sienna Patel', 'Sienna', 'sienna.patel@northwind.example', 'Operations Specialist', 'IC3', 'd2', 'l3', 'e006', '2023-03-13', 'active', 76000),
  E('e010', 'Marcus Jefferson', 'Marcus', 'marcus.jefferson@northwind.example', 'Logistics Coordinator', 'IC2', 'd2', 'l2', 'e007', '2023-11-06', 'active', 64000),
  E('e011', 'Lila Romano', 'Lila', 'lila.romano@northwind.example', 'Operations Analyst', 'IC3', 'd2', 'l1', 'e006', '2024-02-19', 'active', 82000),
  E('e012', 'Owen Pritchard', 'Owen', 'owen.pritchard@northwind.example', 'Logistics Coordinator', 'IC2', 'd2', 'l3', 'e007', '2024-06-10', 'active', 65000),

  // Engineering — reports to Priya (e003)
  E('e013', 'Naomi Silva', 'Naomi', 'naomi.silva@northwind.example', 'Engineering Manager', 'M2', 'd3', 'l4', 'e003', '2021-07-12', 'active', 178000),
  E('e014', 'Kenji Watanabe', 'Kenji', 'kenji.watanabe@northwind.example', 'Senior Software Engineer', 'IC5', 'd3', 'l4', 'e013', '2021-09-20', 'active', 168000),
  E('e015', 'Bryan Hollis', 'Bryan', 'bryan.hollis@northwind.example', 'Senior Software Engineer', 'IC5', 'd3', 'l4', 'e013', '2022-05-02', 'active', 165000),
  E('e016', 'Tiana Brooks', 'Tiana', 'tiana.brooks@northwind.example', 'Software Engineer', 'IC4', 'd3', 'l4', 'e013', '2023-04-24', 'active', 138000),
  E('e017', 'Idris Mahmood', 'Idris', 'idris.mahmood@northwind.example', 'Software Engineer', 'IC3', 'd3', 'l4', 'e013', '2023-09-11', 'active', 122000),
  E('e018', 'Catalina Ruiz', 'Cat', 'catalina.ruiz@northwind.example', 'Site Reliability Engineer', 'IC4', 'd3', 'l4', 'e013', '2024-01-29', 'active', 145000),

  // Sales — reports to Jonas (e004)
  E('e019', 'Devon Reyes', 'Devon', 'devon.reyes@northwind.example', 'Sales Manager', 'M2', 'd4', 'l2', 'e004', '2021-11-15', 'active', 138000),
  E('e020', 'Ari Goldstein', 'Ari', 'ari.goldstein@northwind.example', 'Account Executive', 'IC4', 'd4', 'l2', 'e019', '2022-04-04', 'active', 110000),
  E('e021', 'Mei Chen', 'Mei', 'mei.chen@northwind.example', 'Account Executive', 'IC4', 'd4', 'l4', 'e019', '2023-02-27', 'active', 112000),
  E('e022', 'Tyrone Walker', 'Ty', 'tyrone.walker@northwind.example', 'Sales Development Rep', 'IC2', 'd4', 'l2', 'e019', '2024-01-08', 'active', 64000),
  E('e023', 'Reema Khalid', 'Reema', 'reema.khalid@northwind.example', 'Sales Development Rep', 'IC2', 'd4', 'l1', 'e019', '2024-08-19', 'active', 64000),

  // People team — reports to Aisha (e005)
  E('e024', 'Lena Kowalski', 'Lena', 'lena.kowalski@northwind.example', 'People Operations Specialist', 'IC3', 'd5', 'l1', 'e005', '2022-10-10', 'active', 78000),
  E('e025', 'Sam Whitfield', 'Sam', 'sam.whitfield@northwind.example', 'Recruiter', 'IC3', 'd5', 'l4', 'e005', '2023-06-14', 'active', 84000),

  // Pending start (onboarding)
  E('e026', 'Quinn Halverson', 'Quinn', 'quinn.halverson@northwind.example', 'Senior Software Engineer', 'IC5', 'd3', 'l4', 'e013', '2026-05-12', 'pending_start', 172000),
  E('e027', 'Bree Anderson', 'Bree', 'bree.anderson@northwind.example', 'Account Executive', 'IC4', 'd4', 'l4', 'e019', '2026-05-19', 'pending_start', 108000),
  E('e028', 'Kai Yamashita', 'Kai', 'kai.yamashita@northwind.example', 'Operations Specialist', 'IC3', 'd2', 'l3', 'e006', '2026-05-26', 'pending_start', 76000),
  E('e029', 'Alex Diop', 'Alex', 'alex.diop@northwind.example', 'Software Engineer', 'IC3', 'd3', 'l4', 'e013', '2026-06-02', 'pending_start', 124000),

  // Offboarding
  E('e030', 'Eleanor Pratt', 'Ellie', 'eleanor.pratt@northwind.example', 'Operations Analyst', 'IC3', 'd2', 'l1', 'e006', '2022-03-15', 'offboarding', 82000),
  E('e031', 'Henry Vance', 'Henry', 'henry.vance@northwind.example', 'Software Engineer', 'IC3', 'd3', 'l4', 'e013', '2023-08-21', 'offboarding', 122000),
];

// Resolve manager names
employees.forEach((e) => {
  if (e.managerId) {
    const m = employees.find((x) => x.id === e.managerId);
    e.managerName = m ? m.fullName : null;
  }
});

// Update department headcount based on actives
departments.forEach((d) => {
  d.headcount = employees.filter((e) => e.departmentId === d.id && e.status === 'active').length;
});

// =============================================================================
// TIME OFF REQUESTS
// =============================================================================
export const timeOffRequests: TimeOffRequest[] = [
  {
    id: 't1',
    employeeId: 'e016',
    employeeName: 'Tiana Brooks',
    kind: 'vacation',
    startDate: '2026-05-18',
    endDate: '2026-05-22',
    hours: 40,
    status: 'pending',
    note: 'Family wedding — long planned.',
    submittedAt: '2026-05-01T14:22:00Z',
  },
  {
    id: 't2',
    employeeId: 'e021',
    employeeName: 'Mei Chen',
    kind: 'personal',
    startDate: '2026-05-08',
    endDate: '2026-05-08',
    hours: 8,
    status: 'pending',
    submittedAt: '2026-05-03T09:11:00Z',
  },
  {
    id: 't3',
    employeeId: 'e017',
    employeeName: 'Idris Mahmood',
    kind: 'vacation',
    startDate: '2026-06-15',
    endDate: '2026-06-19',
    hours: 40,
    status: 'approved',
    submittedAt: '2026-04-22T16:40:00Z',
    approverId: 'e013',
  },
  {
    id: 't4',
    employeeId: 'e010',
    employeeName: 'Marcus Jefferson',
    kind: 'sick',
    startDate: '2026-05-04',
    endDate: '2026-05-05',
    hours: 16,
    status: 'approved',
    submittedAt: '2026-05-04T07:55:00Z',
    approverId: 'e007',
  },
  {
    id: 't5',
    employeeId: 'e022',
    employeeName: 'Tyrone Walker',
    kind: 'vacation',
    startDate: '2026-07-06',
    endDate: '2026-07-10',
    hours: 40,
    status: 'rejected',
    note: 'Conflicts with quarterly close.',
    submittedAt: '2026-04-28T11:02:00Z',
    approverId: 'e019',
  },
  {
    id: 't6',
    employeeId: 'e009',
    employeeName: 'Sienna Patel',
    kind: 'parental',
    startDate: '2026-08-01',
    endDate: '2026-10-24',
    hours: 480,
    status: 'pending',
    note: 'Initial parental leave window — will refine on confirmation.',
    submittedAt: '2026-04-15T10:00:00Z',
  },
];

// =============================================================================
// JOBS / RECRUITING
// =============================================================================
export const jobs: Job[] = [
  {
    id: 'j1',
    title: 'Senior Software Engineer, Platform',
    departmentName: 'Engineering',
    locationName: 'Remote — US',
    status: 'open',
    candidates: 4,
    postedAt: '2026-04-02',
  },
  {
    id: 'j2',
    title: 'Account Executive, Mid-Market',
    departmentName: 'Sales',
    locationName: 'Dallas',
    status: 'open',
    candidates: 4,
    postedAt: '2026-04-10',
  },
  {
    id: 'j3',
    title: 'Operations Specialist',
    departmentName: 'Operations',
    locationName: 'Denver',
    status: 'open',
    candidates: 2,
    postedAt: '2026-04-21',
  },
];

export const candidates: Candidate[] = [
  { id: 'c1',  fullName: 'Adriana Cole',    email: 'adriana.cole@example.com',    jobId: 'j1', jobTitle: jobs[0].title, stage: 'final_round',   appliedAt: '2026-04-08', rating: 4 },
  { id: 'c2',  fullName: 'Marcus Tilley',   email: 'marcus.tilley@example.com',   jobId: 'j1', jobTitle: jobs[0].title, stage: 'interviewing',  appliedAt: '2026-04-12', rating: 3 },
  { id: 'c3',  fullName: 'Priya Anand',     email: 'priya.anand@example.com',     jobId: 'j1', jobTitle: jobs[0].title, stage: 'screen',        appliedAt: '2026-04-18', rating: null },
  { id: 'c4',  fullName: 'Jordan Reeves',   email: 'jordan.reeves@example.com',   jobId: 'j1', jobTitle: jobs[0].title, stage: 'applied',       appliedAt: '2026-04-29', rating: null },
  { id: 'c5',  fullName: 'Sasha Lemay',     email: 'sasha.lemay@example.com',     jobId: 'j2', jobTitle: jobs[1].title, stage: 'offer_extended', appliedAt: '2026-04-14', rating: 5 },
  { id: 'c6',  fullName: 'Trevor Owens',    email: 'trevor.owens@example.com',    jobId: 'j2', jobTitle: jobs[1].title, stage: 'interviewing',  appliedAt: '2026-04-19', rating: 4 },
  { id: 'c7',  fullName: 'Halle Bridger',   email: 'halle.bridger@example.com',   jobId: 'j2', jobTitle: jobs[1].title, stage: 'screen',        appliedAt: '2026-04-22', rating: null },
  { id: 'c8',  fullName: 'Devon Akoto',     email: 'devon.akoto@example.com',     jobId: 'j2', jobTitle: jobs[1].title, stage: 'applied',       appliedAt: '2026-05-01', rating: null },
  { id: 'c9',  fullName: 'Rosa Estévez',    email: 'rosa.estevez@example.com',    jobId: 'j3', jobTitle: jobs[2].title, stage: 'interviewing',  appliedAt: '2026-04-25', rating: 3 },
  { id: 'c10', fullName: 'Wyatt Connors',   email: 'wyatt.connors@example.com',   jobId: 'j3', jobTitle: jobs[2].title, stage: 'applied',       appliedAt: '2026-04-30', rating: null },
];

// =============================================================================
// ONBOARDING TASKS — for the 4 pending_start employees
// =============================================================================
const ONBOARDING_TEMPLATE: Array<Omit<OnboardingTask, 'id' | 'employeeId' | 'employeeName' | 'dueDate'>> = [
  { title: 'Sign offer letter',           category: 'paperwork',  status: 'done',        assigneeRole: 'employee' },
  { title: 'Complete I-9 / W-4',          category: 'paperwork',  status: 'in_progress', assigneeRole: 'employee' },
  { title: 'Background check',            category: 'paperwork',  status: 'in_progress', assigneeRole: 'hr' },
  { title: 'Order laptop & accessories',  category: 'equipment',  status: 'todo',        assigneeRole: 'it' },
  { title: 'Provision GSuite + Slack',    category: 'accounts',   status: 'todo',        assigneeRole: 'it' },
  { title: 'Add to payroll',              category: 'paperwork',  status: 'todo',        assigneeRole: 'hr' },
  { title: 'Day-1 welcome session',       category: 'intro',      status: 'todo',        assigneeRole: 'manager' },
  { title: 'Complete security training',  category: 'training',   status: 'todo',        assigneeRole: 'employee' },
  { title: 'First-week 1:1 with manager', category: 'intro',      status: 'todo',        assigneeRole: 'manager' },
  { title: 'Read company handbook',       category: 'training',   status: 'todo',        assigneeRole: 'employee' },
];

export const onboardingTasks: OnboardingTask[] = employees
  .filter((e) => e.status === 'pending_start')
  .flatMap((e) =>
    ONBOARDING_TEMPLATE.map((t, i) => {
      const start = new Date(e.startDate);
      const due = new Date(start);
      due.setDate(start.getDate() + (i < 6 ? -3 : i - 5));
      return {
        id: `${e.id}-task-${i + 1}`,
        employeeId: e.id,
        employeeName: e.fullName,
        title: t.title,
        category: t.category,
        status: t.status,
        assigneeRole: t.assigneeRole,
        dueDate: due.toISOString().slice(0, 10),
      };
    }),
  );

// =============================================================================
// ACTIVITY FEED (recent, used on dashboard)
// =============================================================================
export const activityFeed: Activity[] = [
  { id: 'a1', at: '2026-05-04T08:12:00Z', who: 'Marcus Jefferson',  action: 'submitted a sick day',                 kind: 'time_off' },
  { id: 'a2', at: '2026-05-03T16:45:00Z', who: 'Priya Raman',       action: 'opened a job: Senior Software Engineer', subject: 'Engineering', kind: 'job' },
  { id: 'a3', at: '2026-05-03T14:02:00Z', who: 'Aisha Bello',       action: 'approved time off for Idris Mahmood',  kind: 'time_off' },
  { id: 'a4', at: '2026-05-03T11:31:00Z', who: 'Sam Whitfield',     action: 'moved Sasha Lemay to Offer Extended',   subject: 'Account Executive', kind: 'candidate' },
  { id: 'a5', at: '2026-05-02T17:18:00Z', who: 'Marina Vasquez',    action: 'acknowledged the Q2 Updated Handbook',  kind: 'document' },
  { id: 'a6', at: '2026-05-02T10:09:00Z', who: 'Lena Kowalski',     action: 'started onboarding for Quinn Halverson', kind: 'onboarding' },
  { id: 'a7', at: '2026-05-01T09:48:00Z', who: 'David Okafor',      action: 'completed Q4 review for Rafael Mendoza', kind: 'review' },
  { id: 'a8', at: '2026-04-30T15:21:00Z', who: 'Naomi Silva',       action: 'requested a comp change for Tiana Brooks', kind: 'compensation' },
];

// =============================================================================
// HEADCOUNT TREND (12 months ending current)
// =============================================================================
export const headcountTrend: { month: string; count: number }[] = [
  { month: 'Jun', count: 19 },
  { month: 'Jul', count: 20 },
  { month: 'Aug', count: 21 },
  { month: 'Sep', count: 22 },
  { month: 'Oct', count: 22 },
  { month: 'Nov', count: 23 },
  { month: 'Dec', count: 23 },
  { month: 'Jan', count: 24 },
  { month: 'Feb', count: 24 },
  { month: 'Mar', count: 25 },
  { month: 'Apr', count: 25 },
  { month: 'May', count: 27 },
];

// =============================================================================
// DOCUMENTS — visibility levels mirror RLS policy in 0002_rls.sql
// =============================================================================
export type DocumentVisibility = 'employee_and_hr' | 'hr_only' | 'company' | 'manager_chain';
export type DocumentKind =
  | 'offer_letter'
  | 'handbook'
  | 'policy'
  | 'tax_form'
  | 'review'
  | 'agreement'
  | 'identification'
  | 'other';

export type CompanyDocument = {
  id: string;
  name: string;
  kind: DocumentKind;
  visibility: DocumentVisibility;
  ownerEmployeeId: string | null; // null = company-wide
  ownerName: string | null;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
  acknowledgedRequired: boolean;
  acknowledgedCount?: number;
  totalRequired?: number;
};

export const documents: CompanyDocument[] = [
  { id: 'doc1', name: '2026 Employee Handbook (v3.2)', kind: 'handbook', visibility: 'company', ownerEmployeeId: null, ownerName: null, uploadedBy: 'Aisha Bello', uploadedAt: '2026-04-22', sizeKb: 2840, acknowledgedRequired: true, acknowledgedCount: 23, totalRequired: 27 },
  { id: 'doc2', name: 'Remote Work Policy', kind: 'policy', visibility: 'company', ownerEmployeeId: null, ownerName: null, uploadedBy: 'Aisha Bello', uploadedAt: '2026-03-15', sizeKb: 412, acknowledgedRequired: true, acknowledgedCount: 26, totalRequired: 27 },
  { id: 'doc3', name: 'Information Security Policy', kind: 'policy', visibility: 'company', ownerEmployeeId: null, ownerName: null, uploadedBy: 'David Okafor', uploadedAt: '2026-02-08', sizeKb: 680, acknowledgedRequired: true, acknowledgedCount: 27, totalRequired: 27 },
  { id: 'doc4', name: 'Code of Conduct', kind: 'policy', visibility: 'company', ownerEmployeeId: null, ownerName: null, uploadedBy: 'Aisha Bello', uploadedAt: '2025-11-04', sizeKb: 218, acknowledgedRequired: true, acknowledgedCount: 27, totalRequired: 27 },
  { id: 'doc5', name: 'PTO & Leave Policy', kind: 'policy', visibility: 'company', ownerEmployeeId: null, ownerName: null, uploadedBy: 'Aisha Bello', uploadedAt: '2026-01-12', sizeKb: 156, acknowledgedRequired: false },
  { id: 'doc6', name: 'Offer Letter — Quinn Halverson', kind: 'offer_letter', visibility: 'hr_only', ownerEmployeeId: 'e026', ownerName: 'Quinn Halverson', uploadedBy: 'Sam Whitfield', uploadedAt: '2026-04-18', sizeKb: 142, acknowledgedRequired: false },
  { id: 'doc7', name: 'Offer Letter — Bree Anderson', kind: 'offer_letter', visibility: 'hr_only', ownerEmployeeId: 'e027', ownerName: 'Bree Anderson', uploadedBy: 'Sam Whitfield', uploadedAt: '2026-04-25', sizeKb: 138, acknowledgedRequired: false },
  { id: 'doc8', name: 'W-4 — Marcus Jefferson', kind: 'tax_form', visibility: 'employee_and_hr', ownerEmployeeId: 'e010', ownerName: 'Marcus Jefferson', uploadedBy: 'Marcus Jefferson', uploadedAt: '2023-11-08', sizeKb: 96, acknowledgedRequired: false },
  { id: 'doc9', name: 'I-9 — Sienna Patel', kind: 'identification', visibility: 'employee_and_hr', ownerEmployeeId: 'e009', ownerName: 'Sienna Patel', uploadedBy: 'Sienna Patel', uploadedAt: '2023-03-15', sizeKb: 88, acknowledgedRequired: false },
  { id: 'doc10', name: 'NDA — Quinn Halverson', kind: 'agreement', visibility: 'hr_only', ownerEmployeeId: 'e026', ownerName: 'Quinn Halverson', uploadedBy: 'Sam Whitfield', uploadedAt: '2026-04-19', sizeKb: 102, acknowledgedRequired: false },
  { id: 'doc11', name: 'Q4 2025 Performance Review — Rafael Mendoza', kind: 'review', visibility: 'manager_chain', ownerEmployeeId: 'e006', ownerName: 'Rafael Mendoza', uploadedBy: 'David Okafor', uploadedAt: '2026-05-01', sizeKb: 64, acknowledgedRequired: false },
  { id: 'doc12', name: 'Compensation Philosophy', kind: 'policy', visibility: 'company', ownerEmployeeId: null, ownerName: null, uploadedBy: 'Aisha Bello', uploadedAt: '2025-09-30', sizeKb: 184, acknowledgedRequired: false },
];

// =============================================================================
// PERFORMANCE REVIEWS & GOALS
// =============================================================================
export type PerformanceReview = {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  cycle: string; // e.g. "Q1 2026"
  status: 'not_started' | 'self_review' | 'manager_review' | 'calibration' | 'completed';
  rating: 1 | 2 | 3 | 4 | 5 | null;
  ratingLabel: string | null;
  dueDate: string;
  completedAt?: string;
};

export const performanceReviews: PerformanceReview[] = [
  { id: 'r1', employeeId: 'e006', employeeName: 'Rafael Mendoza', reviewerId: 'e002', reviewerName: 'David Okafor', cycle: 'Q1 2026', status: 'completed', rating: 4, ratingLabel: 'Exceeds expectations', dueDate: '2026-04-30', completedAt: '2026-05-01' },
  { id: 'r2', employeeId: 'e013', employeeName: 'Naomi Silva', reviewerId: 'e003', reviewerName: 'Priya Raman', cycle: 'Q1 2026', status: 'completed', rating: 5, ratingLabel: 'Outstanding', dueDate: '2026-04-30', completedAt: '2026-04-29' },
  { id: 'r3', employeeId: 'e014', employeeName: 'Kenji Watanabe', reviewerId: 'e013', reviewerName: 'Naomi Silva', cycle: 'Q1 2026', status: 'calibration', rating: 4, ratingLabel: 'Exceeds expectations', dueDate: '2026-05-15' },
  { id: 'r4', employeeId: 'e015', employeeName: 'Bryan Hollis', reviewerId: 'e013', reviewerName: 'Naomi Silva', cycle: 'Q1 2026', status: 'manager_review', rating: null, ratingLabel: null, dueDate: '2026-05-15' },
  { id: 'r5', employeeId: 'e016', employeeName: 'Tiana Brooks', reviewerId: 'e013', reviewerName: 'Naomi Silva', cycle: 'Q1 2026', status: 'self_review', rating: null, ratingLabel: null, dueDate: '2026-05-15' },
  { id: 'r6', employeeId: 'e017', employeeName: 'Idris Mahmood', reviewerId: 'e013', reviewerName: 'Naomi Silva', cycle: 'Q1 2026', status: 'self_review', rating: null, ratingLabel: null, dueDate: '2026-05-15' },
  { id: 'r7', employeeId: 'e018', employeeName: 'Catalina Ruiz', reviewerId: 'e013', reviewerName: 'Naomi Silva', cycle: 'Q1 2026', status: 'not_started', rating: null, ratingLabel: null, dueDate: '2026-05-15' },
  { id: 'r8', employeeId: 'e020', employeeName: 'Ari Goldstein', reviewerId: 'e019', reviewerName: 'Devon Reyes', cycle: 'Q1 2026', status: 'manager_review', rating: 3, ratingLabel: 'Meets expectations', dueDate: '2026-05-15' },
  { id: 'r9', employeeId: 'e021', employeeName: 'Mei Chen', reviewerId: 'e019', reviewerName: 'Devon Reyes', cycle: 'Q1 2026', status: 'manager_review', rating: 4, ratingLabel: 'Exceeds expectations', dueDate: '2026-05-15' },
  { id: 'r10', employeeId: 'e007', employeeName: 'Hannah Klein', reviewerId: 'e006', reviewerName: 'Rafael Mendoza', cycle: 'Q1 2026', status: 'self_review', rating: null, ratingLabel: null, dueDate: '2026-05-15' },
];

export type Goal = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: 'business' | 'craft' | 'leadership' | 'culture';
  progress: number; // 0..100
  dueDate: string;
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed';
};

export const goals: Goal[] = [
  { id: 'g1', employeeId: 'e016', employeeName: 'Tiana Brooks', title: 'Ship the new directory search index', description: 'Cut p95 search latency to <120ms via Postgres trigram + cached embeddings.', category: 'craft', progress: 70, dueDate: '2026-06-30', status: 'on_track' },
  { id: 'g2', employeeId: 'e016', employeeName: 'Tiana Brooks', title: 'Mentor one junior IC through onboarding', description: 'Pair-program twice weekly with the next IC2 hire.', category: 'leadership', progress: 30, dueDate: '2026-09-30', status: 'on_track' },
  { id: 'g3', employeeId: 'e014', employeeName: 'Kenji Watanabe', title: 'Lead the auth provider migration', description: 'Move from custom JWT to Supabase Auth without downtime.', category: 'craft', progress: 85, dueDate: '2026-05-31', status: 'on_track' },
  { id: 'g4', employeeId: 'e017', employeeName: 'Idris Mahmood', title: 'Reach IC4 promotion bar', description: 'Demonstrate scope, leadership, and business impact at the next level.', category: 'craft', progress: 45, dueDate: '2026-12-31', status: 'on_track' },
  { id: 'g5', employeeId: 'e006', employeeName: 'Rafael Mendoza', title: 'Reduce ops headcount cost-per-shipment by 8%', description: 'Through automation and improved logistics partner mix.', category: 'business', progress: 55, dueDate: '2026-06-30', status: 'at_risk' },
  { id: 'g6', employeeId: 'e013', employeeName: 'Naomi Silva', title: 'Hire 2 senior engineers', description: 'Fill open Senior IC roles on the platform team.', category: 'leadership', progress: 50, dueDate: '2026-07-31', status: 'on_track' },
  { id: 'g7', employeeId: 'e020', employeeName: 'Ari Goldstein', title: 'Close $2.4M in mid-market ARR', description: 'Quota for H1; pipeline currently 3.1× covered.', category: 'business', progress: 65, dueDate: '2026-06-30', status: 'on_track' },
  { id: 'g8', employeeId: 'e022', employeeName: 'Tyrone Walker', title: 'Generate 60 qualified opportunities', description: 'Outbound + inbound mixed sourcing.', category: 'business', progress: 40, dueDate: '2026-06-30', status: 'off_track' },
];

// =============================================================================
// TIMESHEET ENTRIES — current week for hourly + non-exempt employees
// =============================================================================
export type TimeEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  project?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
};

// Generate a current-week timesheet for a few hourly / non-exempt employees
export const timeEntries: TimeEntry[] = (() => {
  // Anchor week to Mon 2026-05-04 (Monday of current demo week)
  const weekStart = new Date('2026-05-04');
  const days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  type Block = { emp: string; name: string; hours: number[]; status: TimeEntry['status'] };
  const blocks: Block[] = [
    { emp: 'e010', name: 'Marcus Jefferson', hours: [8, 8, 8, 0, 0], status: 'submitted' },
    { emp: 'e012', name: 'Owen Pritchard', hours: [8, 8.5, 8, 8, 7.5], status: 'submitted' },
    { emp: 'e022', name: 'Tyrone Walker', hours: [8, 8, 8, 8, 4], status: 'draft' },
    { emp: 'e023', name: 'Reema Khalid', hours: [8, 8, 8, 8, 8], status: 'approved' },
    { emp: 'e008', name: 'Tomás Aguilar', hours: [9, 8.5, 8, 9, 8], status: 'submitted' },
  ];
  const out: TimeEntry[] = [];
  blocks.forEach((b) => {
    b.hours.forEach((h, i) => {
      if (h > 0)
        out.push({
          id: `${b.emp}-${days[i]}`,
          employeeId: b.emp,
          employeeName: b.name,
          date: days[i],
          hours: h,
          project: 'Operations',
          status: b.status,
        });
    });
  });
  return out;
})();

// =============================================================================
// OFFBOARDING TASKS — for the 2 offboarding employees
// =============================================================================
export type OffboardingTask = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  category: 'access' | 'equipment' | 'paperwork' | 'knowledge' | 'final';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  assigneeRole: 'hr' | 'manager' | 'employee' | 'it';
  dueDate: string;
};

const OFFBOARDING_TEMPLATE: Array<Omit<OffboardingTask, 'id' | 'employeeId' | 'employeeName' | 'dueDate'>> = [
  { title: 'Confirm last day in writing',           category: 'paperwork',  status: 'done',        assigneeRole: 'hr' },
  { title: 'Schedule exit interview',               category: 'paperwork',  status: 'done',        assigneeRole: 'hr' },
  { title: 'Knowledge transfer plan with manager',  category: 'knowledge',  status: 'in_progress', assigneeRole: 'manager' },
  { title: 'Document handoff checklist',            category: 'knowledge',  status: 'in_progress', assigneeRole: 'employee' },
  { title: 'Return company laptop',                 category: 'equipment',  status: 'todo',        assigneeRole: 'employee' },
  { title: 'Return building badge / parking',       category: 'equipment',  status: 'todo',        assigneeRole: 'employee' },
  { title: 'Revoke SSO + Slack access',             category: 'access',     status: 'todo',        assigneeRole: 'it' },
  { title: 'Disable email + forward 30 days',       category: 'access',     status: 'todo',        assigneeRole: 'it' },
  { title: 'Process final paycheck + PTO payout',   category: 'final',      status: 'todo',        assigneeRole: 'hr' },
  { title: 'COBRA / benefits continuation notice',  category: 'final',      status: 'todo',        assigneeRole: 'hr' },
];

export const offboardingTasks: OffboardingTask[] = employees
  .filter((e) => e.status === 'offboarding')
  .flatMap((e) =>
    OFFBOARDING_TEMPLATE.map((t, i) => ({
      id: `${e.id}-off-${i + 1}`,
      employeeId: e.id,
      employeeName: e.fullName,
      title: t.title,
      category: t.category,
      status: t.status,
      assigneeRole: t.assigneeRole,
      // Spread due dates across a 14-day window before "last day"
      dueDate: (() => {
        const end = new Date('2026-05-22');
        end.setDate(end.getDate() - (OFFBOARDING_TEMPLATE.length - i));
        return end.toISOString().slice(0, 10);
      })(),
    })),
  );

// Last-day metadata
export const offboardingMeta: Record<string, { lastDay: string; reason: string; rehireEligible: boolean }> = {
  e030: { lastDay: '2026-05-22', reason: 'Voluntary — relocating', rehireEligible: true },
  e031: { lastDay: '2026-05-30', reason: 'Voluntary — new opportunity', rehireEligible: true },
};

// =============================================================================
// WORKFLOWS — generic approval queue
// =============================================================================
export type WorkflowItem = {
  id: string;
  kind: 'time_off' | 'comp_change' | 'requisition' | 'offboarding' | 'document_ack';
  subject: string;
  requester: string;
  approver: string;
  amount?: string;
  submittedAt: string;
  dueBy: string;
  status: 'pending' | 'approved' | 'rejected';
  step: string; // e.g. "Manager review (1 of 2)"
};

export const workflowItems: WorkflowItem[] = [
  {
    id: 'wf1',
    kind: 'time_off',
    subject: 'Tiana Brooks — vacation, 5 days',
    requester: 'Tiana Brooks',
    approver: 'Naomi Silva',
    submittedAt: '2026-05-01T14:22:00Z',
    dueBy: '2026-05-08',
    status: 'pending',
    step: 'Manager review (1 of 1)',
  },
  {
    id: 'wf2',
    kind: 'time_off',
    subject: 'Sienna Patel — parental leave, 12 weeks',
    requester: 'Sienna Patel',
    approver: 'Rafael Mendoza',
    submittedAt: '2026-04-15T10:00:00Z',
    dueBy: '2026-05-06',
    status: 'pending',
    step: 'Manager review (1 of 2)',
  },
  {
    id: 'wf3',
    kind: 'comp_change',
    subject: 'Tiana Brooks — promotion to IC4 + 12% increase',
    requester: 'Naomi Silva',
    approver: 'Priya Raman',
    amount: '+$16,560 / yr',
    submittedAt: '2026-04-30T15:21:00Z',
    dueBy: '2026-05-09',
    status: 'pending',
    step: 'Skip-level approval (2 of 3)',
  },
  {
    id: 'wf4',
    kind: 'requisition',
    subject: 'Open req: Senior Backend Engineer',
    requester: 'Naomi Silva',
    approver: 'Priya Raman',
    amount: '$165k — $185k',
    submittedAt: '2026-04-29T09:30:00Z',
    dueBy: '2026-05-07',
    status: 'pending',
    step: 'VP approval (1 of 2)',
  },
  {
    id: 'wf5',
    kind: 'document_ack',
    subject: 'Q2 Updated Handbook — 4 employees outstanding',
    requester: 'Aisha Bello',
    approver: 'Aisha Bello',
    submittedAt: '2026-04-22T11:00:00Z',
    dueBy: '2026-05-15',
    status: 'pending',
    step: 'Acknowledgements pending',
  },
  {
    id: 'wf6',
    kind: 'offboarding',
    subject: 'Eleanor Pratt — last day May 22',
    requester: 'Rafael Mendoza',
    approver: 'Aisha Bello',
    submittedAt: '2026-05-01T08:00:00Z',
    dueBy: '2026-05-22',
    status: 'pending',
    step: 'Final HR signoff (3 of 3)',
  },
  {
    id: 'wf7',
    kind: 'time_off',
    subject: 'Idris Mahmood — vacation, 5 days',
    requester: 'Idris Mahmood',
    approver: 'Naomi Silva',
    submittedAt: '2026-04-22T16:40:00Z',
    dueBy: '2026-04-29',
    status: 'approved',
    step: 'Manager approved',
  },
  {
    id: 'wf8',
    kind: 'comp_change',
    subject: 'Marcus Jefferson — annual merit, 4%',
    requester: 'Hannah Klein',
    approver: 'Rafael Mendoza',
    amount: '+$2,560 / yr',
    submittedAt: '2026-04-18T12:00:00Z',
    dueBy: '2026-04-25',
    status: 'approved',
    step: 'Manager approved',
  },
];

// =============================================================================
// HELPERS
// =============================================================================
export function getEmployee(id: string) {
  return employees.find((e) => e.id === id) || null;
}

export function getDirectReports(managerId: string) {
  return employees.filter((e) => e.managerId === managerId);
}

export function getActiveEmployees() {
  return employees.filter((e) => e.status === 'active');
}

export function getPendingApprovals() {
  return timeOffRequests.filter((r) => r.status === 'pending');
}

export function getUpcomingOnboarding() {
  return employees.filter((e) => e.status === 'pending_start');
}

export function getOpenJobs() {
  return jobs.filter((j) => j.status === 'open');
}

export function getOnboardingTasksFor(employeeId: string) {
  return onboardingTasks.filter((t) => t.employeeId === employeeId);
}

export function getOnboardingProgress(employeeId: string) {
  const tasks = getOnboardingTasksFor(employeeId);
  if (tasks.length === 0) return { done: 0, total: 0, pct: 0 };
  const done = tasks.filter((t) => t.status === 'done').length;
  return { done, total: tasks.length, pct: Math.round((done / tasks.length) * 100) };
}

export function getDocumentsForEmployee(employeeId: string) {
  return documents.filter((d) => d.ownerEmployeeId === employeeId);
}

export function getCompanyDocuments() {
  return documents.filter((d) => d.visibility === 'company');
}

export function getReviewsForCycle(cycle: string) {
  return performanceReviews.filter((r) => r.cycle === cycle);
}

export function getGoalsForEmployee(employeeId: string) {
  return goals.filter((g) => g.employeeId === employeeId);
}

export function getTimeEntriesForWeek() {
  return timeEntries;
}
