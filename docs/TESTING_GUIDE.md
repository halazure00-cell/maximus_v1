# Testing Guide

Use this guide to validate core flows in a clean PWA clone.

## Automated Tests

```bash
npm run test
```

### Single test file

```bash
npm run test -- src/lib/__tests__/syncHelpers.test.js
```

### Single test by name

```bash
npm run test -- -t "should return positive when server is newer"
```

## Manual Regression Checklist (Minimal)

1. **Login**: authentication succeeds, no console errors
2. **Create Order**: order saved and visible in history
3. **Add Expense**: expense saved and visible
4. **Offline**: create order offline, sync after reconnect
5. **Insight**: charts render without errors

## Build Verification

```bash
npm run lint
npm run build
```
