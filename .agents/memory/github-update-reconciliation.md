---
name: GitHub update reconciliation
description: Preserve working Replit setup when incorporating future Zipy Codes GitHub updates.
---

Treat the GitHub origin's generated updates as application changes to review, not as a wholesale replacement for this workspace's Replit setup.

**Why:** A later upstream snapshot removed the working workflow configuration, lockfile, and run documentation while reverting Vite's port/host and the existing signing-secret fallback. Applying it uncritically would break the preview and local authentication setup.

**How to apply:** Compare upstream changes first and reconcile useful application fixes into the current project. Preserve working Replit-specific setup unless the new version explicitly replaces it with an equivalent verified configuration.