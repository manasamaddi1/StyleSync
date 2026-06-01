# Testing

This folder contains lightweight smoke tests for the most important StyleSync
integration contracts.

The goal is to make it easy to verify that the frontend, backend, and API
surfaces are wired together the way the project documentation describes, even
without standing up the full deployed stack.

## What is covered

- `frontend.test.mjs`
  - checks that the upload UI reads recommendation-ready prediction fields
  - checks that the browser API client exposes predict, upload, wardrobe, and
    recommendation calls

- `backend.test.mjs`
  - checks that shared TypeScript types include structured recommendation fields
  - checks that the wardrobe API persists those fields
  - checks that the recommendation engine reads those same fields

- `api_contract.test.mjs`
  - checks that `app.py` exposes the expected prediction keys
  - checks that the HF client parses the same keys
  - checks that the Next.js prediction route forwards the HF response

## How to run

From the repo root:

```bash
node --test testing/*.test.mjs
```

These are smoke/contract tests rather than full browser automation or model
accuracy tests, but they give a clear regression signal for the code paths that
connect model predictions to the recommendation-ready wardrobe format.
