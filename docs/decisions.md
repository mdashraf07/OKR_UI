# Design & Architecture Decisions

This document logs all architectural, UX, and data decisions made to connect the company brief with the implementation, adhering strictly to Section 2 and Section 4 of the build specification.

---

### D-01: Two Distinct Status Concepts
- **Decision:** Separate Objective lifecycle status (`Draft`, `Active`, `Completed`, `Archived`) from Objective health (`On Track`, `At Risk`, `In Trouble`), Approval state (`NotSubmitted`, `PendingManager`, `PendingHR`, `Returned`, `Rejected`, `Approved`), and individual KR status (`On Track`, `At Risk`, `In Trouble`, `Completed`).
- **Reasoning:** In the brief, "On Track" and "At Risk" are health metrics, not lifecycle states. An objective can be Active and healthy while an individual KR is At Risk. Different visual shapes (filled pill vs outlined gauge chip vs outlined dot chip) prevent user confusion.

### D-02: Delayed Key Result Marker
- **Decision:** A KR is flagged with a red "Delayed" tag if `demoDate > targetDate` and `achievementPercent < 100`.
- **Reasoning:** Allows managers to distinguish between off-pace KRs still within their timeline versus overdue commitments.

### D-03: KR Dates Schema Addition
- **Decision:** Added `startDate` and `targetDate` directly to `KeyResult`, constrained to fit within parent `Objective` start and end dates.
- **Reasoning:** Required by brief section 3 ("start and target date") and necessary to compute time-based expected progress accurately.

### D-04: Automated KR Status with Manual Override
- **Decision:** KR status is calculated automatically from pace gap (`achievement% - expected%`), but KR owners and managers can manually override it with a mandatory reason.
- **Reasoning:** Satisfies both the automated intelligence requirement and human contextual judgment (e.g. external supplier blockers not captured by pure math).

### D-05: Objective Progress Calculation
- **Decision:** Calculated as `sum(KR achievement % * KR weightage) / 100`. Submission requires sum of KR weightages to be exactly 100.
- **Reasoning:** Ensures mathematical integrity and clear distribution of accountability across key results.

### D-06: Two-Stage Approval Workflow
- **Decision:** Employee -> Level 1 (Manager) -> Level 2 (HR/Admin). Only Level 2 approval transitions lifecycle from Draft to Active. Resubmissions restart at Level 1.
- **Reasoning:** Matches enterprise HR governance requirements and ensures both line management and HR oversight.

### D-07: Design Token Architecture & CSS Variables
- **Decision:** All colors, layout measurements, radius, and motion easings are defined as CSS variables in `src/styles/tokens.css` and bound to Tailwind CSS.
- **Reasoning:** Eliminates hardcoded magic numbers and ensures 100% fidelity with the HRMS video recording.

### D-08: Mock Service Layer with LocalStorage Persistence
- **Decision:** The API layer returns Promises with 300–800ms simulated latency and persists seed and state mutations in `localStorage`.
- **Reasoning:** Enables a production-like asynchronous frontend experience with realistic loading skeletons, optimistic updates, and persistent state across reloads.

### D-09: Slide-over Drawers with Zero Page Departure
- **Decision:** Objective creation (S2), Add KPI (S3), Key Result details (S5), and Check-ins (S6) slide in from the right over the OKR list as overlay drawers. URL navigation to `/okrs/new` automatically opens the drawer in-place without page transitions.
- **Reasoning:** Matches user expectation and reference product workflow; preserving the user's scroll position, filters, and mental context across the tree table.

### D-10: Decoupled Independent Lifecycle for Objectives and Key Results
- **Decision:** Users can create an Objective separately without requiring any initial Key Results. Key Results can subsequently be added individually via the `+` action button on the Objective row.
- **Reasoning:** Eliminates wizard friction, allowing strategic goals to be planned first and operational KPIs to be defined iteratively or delegated later.

