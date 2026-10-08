# OKR Hub - Change Log

- 1.1: Fixed approval review loading and route params by preserving string IDs without parsing to numbers, enabling Review, Approve, Return, Reject, and Reassign across stages.
- 1.2: Toasts limited to max 3 visible, 4s auto-dismiss, duplicate suppression, and automatic clearing on route changes.
- 1.3: Unknown IDs for objectives, KRs, and approvals display a friendly ItemNotFound page with back links and no toast loops, protected by a top-level ErrorBoundary.
- 1.4: Seeded multi-cycle score records, separated raw achievement and calculated score into distinct columns, and enforced dynamic recalculation vs immutable final scores.
- 1.5: Enforced single active cycle governance with confirmation modal upon activation and unified header cycle label dynamically across all screens.
- 1.6: Validated all routes and role permissions, fixing broken handlers and type mismatches.
