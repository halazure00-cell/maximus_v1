# Heatmap Overview

This document is a concise baseline for the driver heatmap system.

## Purpose

- Recommend strategic spots for drivers
- Show order potential based on order history
- Optional: optimize for net income per hour and reduce deadhead

## Key Inputs

- Order history
- Time-of-day buckets
- Distance cost model

## Scoring Concepts

- Mode: Potensi Order
  - Density of order history per grid cell (primary)
  - Time-of-day filter (current bucket vs all hours)
  - Confidence score based on sample size
- Mode: Potensi Untung
  - Net income per hour: (trips + earnings - expenses) per time bucket
  - Deadhead cost penalty: jarak ke titik demand terdekat dalam bucket waktu yang sama
  - Confidence score based on sample size

## Technical Notes

- H3 is used for geospatial bucketing (future grid expansion)
- Results are cached locally for offline access
- Fallbacks apply when data is sparse
- Deadhead cost and radius are configurable in Settings
- Default view prioritizes order potential for drivers
