---
name: GitHub update reconciliation
description: Preserve working Replit setup when incorporating future Zipy Codes GitHub updates.
---

Treat the GitHub origin's generated updates as application changes to review, not as a wholesale replacement for this workspace's Replit setup.

**Why:** Upstream snapshots have removed working Replit preview and signing configuration, replaced the completed homepage, and introduced root-level source fragments instead of integrating them at live paths. Some draft fragments were unsafe or incomplete despite looking like features.

**How to apply:** Compare upstream changes first and reconcile useful application fixes into the current project. Preserve working Replit-specific setup and finished UI unless replaced with equivalent verified behavior. Treat root-level numbered source files as proposals to audit, not live features to copy wholesale.