# Nightingale Silence V2 Constitution

## Core Principles

### I. Existing Project Truth Comes First

- `AGENTS.md` defines the mandatory long-term operating rules for this repository.
- `docs/OWNER_VISION.md` is the product and content vision source. Specs MUST stay within
  that vision unless the owner explicitly changes it.
- Existing code is the source of truth for current runtime behavior when documentation is
  stale. Any material mismatch discovered during a task MUST be reported, and durable
  documentation SHOULD be updated within the approved task scope.
- Spec Kit artifacts supplement the existing `docs/ai/` knowledge base. They MUST NOT
  silently replace, weaken, or contradict it.

### II. Planning and Approval Gates Are Mandatory

- Complete features, refactors, deletions, cross-file changes, cross-project integration,
  and architecture changes MUST begin with read-only analysis and a written plan.
- The plan MUST identify the current project and stack, files read, requirement
  interpretation, affected files, implementation steps, risks, and verification strategy.
- Implementation MUST NOT start until the owner explicitly confirms the plan. Running
  `$speckit-implement` does not bypass this approval gate.
- A narrow, unambiguous fix MAY proceed after reading the relevant files, provided it does
  not broaden into unrelated refactoring or architecture work.

### III. Behavior Fidelity and Data Accuracy Are Non-Negotiable

- Changes MUST preserve established architecture, naming, components, services, and
  interfaces unless an approved plan says otherwise.
- FFXIV data, item mappings, dyes, images, Canvas output, locale data, and exported results
  MUST be handled conservatively and checked against validated behavior or source data.
- Existing user-visible behavior and external contracts MUST remain compatible during
  migrations and refactors unless a breaking change is explicitly approved.
- New dependencies MUST NOT be introduced without first documenting the reason, impact,
  alternatives, and receiving owner approval.

### IV. Public Content, Localization, and Assets Require Explicit Control

- All fixed user-visible UI text, status text, labels, placeholders, titles, and accessibility
  text MUST come from localization keys. Hard-coded display strings are prohibited.
- When final copy has not been supplied, generated visible copy MUST be `占位用，待编辑`.
- Image assets MUST NOT be committed, published, statically imported, or included in build
  output unless the owner explicitly authorizes them for project use.
- Credentials, cookies, tokens, private paths, internal notes, and local identity mappings
  MUST remain out of public artifacts and Git history.
- User input, uploads, authentication, environment variables, and external APIs MUST be
  implemented with conservative validation and explicit error handling.

### V. Scope Discipline and Verification Are Required

- Every change MUST stay within the approved scope. Unrelated files MUST NOT be reformatted,
  reorganized, reverted, staged, or committed.
- Code MUST NOT be deleted until source, template, style, route, dynamic import, string-based
  invocation, configuration, tests, and external compatibility references have been checked.
- Verification depth MUST match risk: use existing checks, tests, builds, API validation, and
  browser inspection where applicable. Any verification that cannot be run MUST be reported
  with the residual risk.
- Before a commit or push, the exact staged diff, authorized assets, Git identity, GitHub
  account, and public history requirements in `AGENTS.md` MUST be checked.

## Spec-Driven Workflow

For work that requires a formal feature specification, use this sequence:

1. `$speckit-specify` creates a user-centered specification under `specs/`.
2. `$speckit-clarify` MAY resolve material ambiguity before planning.
3. `$speckit-plan` creates the technical plan and constitution compliance check.
4. The owner reviews and explicitly confirms the plan before implementation.
5. `$speckit-tasks` creates scoped, verifiable tasks.
6. `$speckit-analyze` MAY check cross-artifact consistency before implementation.
7. `$speckit-implement` executes only the confirmed scope.

Specifications describe one feature or change. Durable architecture, API, deployment, and
module knowledge MUST still be recorded in the appropriate `docs/ai/` document when the
approved work creates long-term project knowledge.

## Quality Gates

- Specs MUST state user value, scope boundaries, acceptance scenarios, and measurable
  success criteria without prematurely prescribing implementation details.
- Plans MUST cite the repository files and established patterns they rely on.
- Tasks MUST be independently actionable, traceable to the spec and plan, and include the
  required verification work.
- Final reporting MUST list changed files, reasons, compatibility impact, completed
  verification, and remaining risks.

## Governance

- This constitution operationalizes existing project rules; it does not supersede
  `AGENTS.md` or `docs/OWNER_VISION.md`. When rules appear inconsistent, the stricter
  requirement applies and implementation stops until the conflict is resolved.
- Constitution amendments require explicit owner approval and a documented reason.
- Version changes follow semantic versioning: MAJOR for incompatible governance changes,
  MINOR for new principles or materially expanded requirements, and PATCH for clarifications.
- Every Spec Kit plan and review MUST verify compliance with the current constitution and
  the project documents referenced above.

**Version**: 1.0.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
