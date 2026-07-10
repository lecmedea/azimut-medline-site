---
name: performance-optimizer
description: Frontend performance for azimut-medline-site — large audio assets, images, GitHub Pages static hosting, Core Web Vitals, lazy loading.
version: 1.0.0
author: awesome-grok-build
---

# Performance Optimizer (Azimut Clinic)

Known hotspots: ~45MB audio in assets/audio/, heavy hero images, fixed background attachments.

## Workflow

1. Measure: page weight, LCP image, render-blocking CSS.
2. Smallest wins first: lazy-load images/audio, compress assets, reduce fixed backgrounds on mobile.
3. Verify before/after with curl timing or Lighthouse if available.