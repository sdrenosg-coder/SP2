---
name: Imported-project preflight
description: How to interpret generated import notes while setting up the project.
---

Treat generated import/preflight notes as hints, not definitive diagnostics. Check the current filesystem and exercise the actual startup path before changing code based on reported missing files or services.

**Why:** The imported README reported missing local modules that were already present, while the actual startup failure came from undeclared packages not mentioned there.

**How to apply:** On future import-related fixes, confirm the current file layout and runtime failure first; avoid restructuring or replacing modules just because the generated notes say they are missing.