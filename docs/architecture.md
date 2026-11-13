# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the shared API client as the only browser-to-API boundary. Each route owns its capability view and exposes accessible loading, empty, and error states; presentation components do not calculate business results.
- Logic tier decision: Keep HTTP handling in the Express routes and capability behavior in `octofitService.ts`. Validate request data and references before writes, return deliberate 4xx responses for invalid or unknown resources, and pass unexpected failures to the existing Express error handler.
- Data tier decision: Make Mongoose schemas enforce required fields and valid references, default team members to an empty array, and persist the activity and workout fields required by the API. Keep demo data creation idempotent and preserve unrelated records.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; validate both IDs and confirm the referenced user and team exist. Store their references, the submitted activity details, server-generated `occurredAt`, and computed `points` (`1` point per minute) when creating the activity.
- Team management approach: Require a non-empty name and mascot, default omitted members to an empty array, and preserve the submitted name and mascot in create/list responses. Validate supplied member IDs before saving.
- Leaderboard approach: Aggregate persisted activity points by team, include teams with no activities at zero points, sort by total points descending, and assign 1-based ranks in the response.
- Workout suggestions approach: Find the user by email and use the user's fitness goal to select a matching workout when available; otherwise use the user's most recent activity type as the focus. Include a short reason for the match and return a 4xx response when the email has no matching user.

## Test plan

Baseline run on 2026-11-13:

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — **fails (4 failed, 1 passed)**. The user, team, activity, and workout schema validation checks fail when required fields are missing; the idempotent seed test passes.
- API: `npm run test:api --prefix octofit-tracker/backend` — **fails (4 failed)**. Activity and team validation currently return `501` instead of `400`, the leaderboard returns no entries for recorded activity, and workout suggestions do not match the user's goal/activity. These failures identify incomplete API/service behavior.
- Frontend: `npm test --prefix octofit-tracker/frontend` — **fails (15 failed)**. The route components do not yet render API-backed capability data or the required loading, empty, and accessible error states, and the workout route does not request suggestions for the selected user.
- Backend build: `npm run build --prefix octofit-tracker/backend` — **passes**. A failure indicates a TypeScript compile/type error.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — **passes**. A failure indicates a TypeScript or Vite production-build error.

Run the data tests first, then the API tests, then frontend tests; finish with both builds. A failure should be fixed in the tier named by that command before moving to dependent tiers. The repository-level exercise scaffolding check is separate from these application contracts; failures there concern exercise files or workflow/README conventions, not OctoFit tier behavior.
