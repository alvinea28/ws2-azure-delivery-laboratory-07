# AgentAlvine automatic lab toolkit

Use [independent setup](../../docs/start-here.md), then your own private copy's **one Exercise body**. AgentAlvine updates instructions/progress from real work; no manual checkboxes, evidence PRs or run-ID submissions.

## Five existing lessons

| Step | Inline actions |
| --- | --- |
| [1](../steps/01.md) | Setup, identity map, complete Actions construction and offline checks |
| [2](../steps/02.md) | Owner readiness, real PR merge and first plan/apply |
| [3](../steps/03.md) | Later note PR/apply and Azure portal configuration |
| [4](../steps/04.md) | One tag update, real readback and fresh followup |
| [5](../steps/05.md) | Separate admin-authorized cleanup and Azure absence |

The same five checkpoints remain: committed identity map; actual plan; note plus same-run plan/apply; no-change; dedicated cleanup. Construction and portal observations add no check or award. `lessonPresentation: concise` changes presentation only.

## Observer boundaries

- This metadata-only observer loads the trusted default branch and reads learner files at immutable SHAs; it never executes PR code or downloads plans/state.
- Delivery and **Trusted dev cleanup (explicit owner authorization required)** completion events are observed. Stale, skipped, fork, rerun and wrong-workflow records cannot substitute; jobs from different runs are never combined.
- It does not inspect Azure configuration or prove resource absence. AgentAlvine never dispatches delivery, has no cloud tokens, and never authorizes Azure.
- Public templates/Preview award no learner progress. Approved live work still needs owner scope/budget/lifetime/bootstrap readiness; cleanup needs its own authorization.
- Existing `repeatOnChange` paths and checkpoint timing remain unchanged. Historical jobs cannot prove a later revision; neither reading a lesson nor a green mock creates live completion.
