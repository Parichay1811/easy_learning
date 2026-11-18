# Admin: the principal's view of the whole school

[← Roadmap](README.md) · [Foundations](FOUNDATIONS.md) · [Design](DESIGN.md) · [Parent](PARENT.md) · [Teacher](TEACHER.md) · [Super Admin](SUPER_ADMIN.md)

**Who:** the principal, owner or coordinator of a school, coaching centre or
tutoring business: the **Institute** workspace. (In a Solo workspace the tutor
is their own admin, and these screens collapse into the teacher's settings.)

**The promise:** *"I set up my whole school in an afternoon, everyone is in the
right place, and in one screen I see how every grade, class, teacher and student is
doing, then drill into any of them."*

---

## What exists today

- Org registration → super admin approval/rejection (reversible), editing and resubmission, logo upload ([adminController.js](../../server/controllers/adminController.js), design-guide §5.4).
- CRUD for tutors (teachers), students, parents, subjects and batches. Batches have subjects, teachers per subject and weekly schedules with conflict checks ([BatchDetail.jsx](../../client/src/components/Admin/BatchDetail.jsx)).
- Student dashboards and performance, tutor performance and schedule, question upload review (approve/reject/edit), chat with the super admin, stats ([AdminDashboard.jsx](../../client/src/pages/admin/AdminDashboard.jsx)).
- **Gaps:**
  - The structure is flat (no campus/grade/section).
  - No bulk import, staff roles, school-wide analytics, teacher performance overview, academic years, policies, reports, billing or seats.
  - School-added parents can't log in as parents (FND-012).

---

## A1. Set up the school

- [ ] **ADM-001** Setup wizard `P1` `Institute`
  - Org profile (exists) → **structure** (ADM-010) → **import people** (ADM-020) → **assign** teachers to groups → **invite parents** → **policies** (ADM-060). A progress meter shows what's left. It can be paused and resumed.
- [ ] **ADM-002** Approval status and plan `P0` `Institute` · needs FND-030
  - Clear banners for pending / approved / rejected (with the reason and a resubmit button: exists), the current plan, trial days left, and seats used vs bought.

## A2. The school tree

- [ ] **ADM-010** Structure builder `P1` `Institute` · module `org.tree` · needs FND-017
  - A visual tree: **Campus (optional) → Grade/Year → Section/Class → Groups**. Drag to move, rename inline, bulk-create ("Grades 1–8, sections A–C"). Departments (Maths, Science) can be set up as a second view of the same people.
- [ ] **ADM-011** People in the tree `P1` `Institute`
  - Every node shows its counts (students, teachers, groups) and a mini health bar (engagement). Click to open that node's dashboard (ADM-040).
- [ ] **ADM-012** Academic years and promotion `P1` `Institute` · needs FND-018
  - Create the next year and **promote** students (Grade 4A → 5A in bulk, with exceptions for repeaters and leavers). Archive last year's groups and tests (read-only, still reportable).

## A3. People

- [ ] **ADM-020** Bulk import `P0` `Institute`
  - CSV/XLSX for students (name, grade, section, optional email, parent emails) and teachers (name, email, subjects, units). Mapping screen, validation preview (duplicates, bad emails, missing grades), dry run, then import. Re-importing updates rather than duplicating. Google Classroom / Microsoft School Data Sync import is `P2`.
- [ ] **ADM-021** Managed student logins `P1` `Institute` · needs FND-011
  - For young students without email: printable login cards per class (picture password / QR) and a one-click reset.
- [ ] **ADM-022** Parent invitations `P0` `Institute` · needs FND-012
  - Invite from student rows or in bulk. Track status (invited / linked / bounced). Resend. The invite is the verified link, so no codes are needed.
- [ ] **ADM-023** Staff roles `P1` `Institute` · module `staff.roles` · needs FND-020
  - **Admin** (everything), **Coordinator / Head of department** (everything inside chosen units or subjects), **Teacher**, **Office staff** (people management, no analytics), **Viewer** (read-only analytics, e.g. for a board member). Custom roles `P2`.
- [ ] **ADM-024** Moves and leavers `P1` `Institute`
  - Move a student between sections (history follows them), mark a leaver (keeps data per the retention policy) and transfer a teacher's groups to another teacher.
- [ ] **ADM-025** Seats `P1` `Institute` · needs FND-031
  - Active students count as seats. A warning at 90 %, then adding is blocked at 100 % with "buy more seats". The learning itself is never blocked.

## A4. Analytics at every level

The same shell, time-range bar and chart kit as everyone else ([DESIGN.md](DESIGN.md)).
**Levels: school → campus → grade → section → group → subject → teacher → student.**
Every level has the same five blocks: story · tiles · main chart · comparisons · lists.

- [ ] **ADM-040** School overview `P0` `Institute` · module `org.analytics` · needs FND-043
  - Story card ("84 % active this week; Grade 4 Science dipped 7 points; 12 at risk"). Tiles: active students %, minutes per student, average mastery, tests completed, at-risk count, parents linked %. A **unit sunburst** coloured by engagement. A **grade × subject heatmap**. Trends vs the previous term.
- [ ] **ADM-041** Teacher overview `P1` `Institute` · module `org.analytics`
  - For each teacher: groups and students, tests and practice sets created, questions contributed (approval rate), class engagement, **class growth** (mastery change of their students), marking turnaround, parent reply time and last active.
  - Framed as **support, not ranking:** default sort by name, with context (class size, starting level). Teachers see the same numbers about themselves (TCH-056).
- [ ] **ADM-042** Compare `P1` `Institute`
  - Any two or more units, groups, teachers or periods side by side (e.g. 5A vs 5B in Maths this term), with normalised metrics and a fairness note when group sizes differ.
- [ ] **ADM-043** At-risk and wins lists `P0` `Institute` · needs FND-041
  - Students meeting the at-risk rule, grouped by unit, with their teacher and the reason. One click opens the student or messages the teacher/parent. "Wins" lists the biggest improvers to celebrate.
- [ ] **ADM-044** Usage and adoption `P1` `Institute`
  - Logins by role over time, devices, peak hours, feature use (tests, AI Teacher, AR games) and parents linked/active. Shows where training is needed.
- [ ] **ADM-045** Test and question analytics, school-wide `P1` `Institute`
  - Common assessments compared across sections, an item bank health view (questions flagged as confusing or wrong key) and curriculum coverage by grade.
- [ ] **ADM-046** Student profile (admin view) `P0` `Institute`
  - Today's per-student dashboards (exists) moved into the shared in-depth profile, with school-context activity plus the teacher notes the school can see.

## A5. Content and quality

- [ ] **ADM-050** Question review queue `P0` `Institute` (exists: improve)
  - Keep the approve/reject flow and add a side-by-side preview on the wooden board, reviewer notes, bulk approve and an SLA counter. Coordinators review their own departments.
- [ ] **ADM-051** School question bank `P1` `Institute`
  - Approved questions become a shared school bank with tags, collections and ownership. Teachers can reuse them (TCH-023).
- [ ] **ADM-052** Common tests `P1` `Institute`
  - The admin or a coordinator builds a test once and assigns it to many sections (same rules), then compares results (ADM-042).

## A6. Policies and settings

- [ ] **ADM-060** Policies `P1` `Institute` · module `comms.policy` · needs FND-022
  - Teachers may create their own groups (y/n). Parent ↔ teacher messaging (off / parent starts / both), office hours. Parents see class averages (y/n). Leaderboards (off / within group). AI Teacher during school hours (on/off). Which activity the school sees (assigned work only / school hours / all with parental consent).
- [ ] **ADM-061** Branding `P1` `Institute` · module `reports.branded`
  - Logo (exists), colours, report header and footer, and a custom welcome message on the join page.
- [ ] **ADM-062** Calendar `P2` `Institute`
  - Terms, holidays and exam weeks. Used by streak logic (holidays don't break streaks if the school wishes) and the analytics comparisons.

## A7. Communication and reports

- [ ] **ADM-070** Announcements `P1` `Institute` · needs FND-052
  - To the whole school, a unit, all parents of a grade, or staff only. Schedule them, see read rates.
- [ ] **ADM-071** Messages `P1` `Institute` · needs FND-051
  - Admin ↔ teachers, admin ↔ parents, admin ↔ Learnigo support (exists). With the right staff role, the admin can see messaging **activity** (counts, reply times) but not the content, unless policy and law allow it.
- [ ] **ADM-072** Reports `P1` `Institute` · needs FND-060
  - Term report cards per student (bulk PDF per section), section/grade/school reports for meetings and board packs, scheduled monthly summary email to the admin.
- [ ] **ADM-073** Export `P1` `Institute` · needs FND-062
  - Any table to CSV/XLSX. Full school export (for moving systems or audits) on request, logged in the audit log.

## A8. Billing, privacy, audit

- [ ] **ADM-080** Billing `P1` `Institute` · needs FND-032
  - Plan, seats, invoices, pay by card or request an invoice/PO, renewal date, VAT ID.
- [ ] **ADM-081** Data protection `P1` `Institute` · needs FND-070, FND-071
  - Sign the data-processing agreement in the app. Records of consent for each student. Retention settings (keep data N years after leaving). Handle parent data requests for the school's students.
- [ ] **ADM-082** Audit log `P1` `Institute` · needs FND-072
  - Who changed what in the school: imports, role changes, grade changes, exports, deletions, sensitive views. Filter and export.

---

## Done means

- A 500-student school is set up (tree, import, teachers assigned, parents invited) in **under 2 hours** using the wizard and CSV import.
- The school overview loads in < 2 s and any drill-down in < 500 ms, from rollups.
- A coordinator sees only their units. Verified by the permission suite (FND-002).
- In a meeting, the principal answers "Which section needs help in Maths this term, and why?" in under a minute.

## Links to other roles

- **Teacher:** groups, policies, question review, teaching summaries ([TEACHER.md](TEACHER.md)).
- **Parent:** invites, announcements, reports, privacy ([PARENT.md](PARENT.md)).
- **Super admin:** approval, plan and seats, support, data-processing agreement and data requests ([SUPER_ADMIN.md](SUPER_ADMIN.md)).
