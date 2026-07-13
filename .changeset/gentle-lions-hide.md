---
"@playfast/echoform": patch
---

Withhold `update_view` / `delete_view` broadcasts from clients that have not yet requested the view tree. Previously, in `singleInstance` mode, a client connecting while views were updating could receive an incremental prop diff before its `update_views_tree` snapshot; the client materialized the unknown view from the diff alone, yielding a view with only the changed props (missing callback and data props) and crashing the client renderer on the first missing-prop access (e.g. `props.onSelectCategory.mutate` in the wmux TUI during dev-server startup).
