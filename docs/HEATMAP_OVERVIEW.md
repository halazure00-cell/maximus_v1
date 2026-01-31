# Heatmap Overview

This document is a concise baseline for the driver heatmap system.

## Purpose

- Recommend strategic spots for drivers
- Optimize for net income per hour
- Reduce deadhead travel and idle time

## Key Inputs

- Order history
- Time-of-day buckets
- Distance cost model

## Scoring Concepts

- Net income per hour (primary)
- Conversion rate (proxy for wait time)
- Deadhead cost penalty
- Confidence score based on sample size

## Technical Notes

- H3 is used for geospatial bucketing (future grid expansion)
- Results are cached locally for offline access
- Fallbacks apply when data is sparse
