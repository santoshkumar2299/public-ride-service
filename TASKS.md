# Public Ride Share MVP – Task List

## Frontend

- [ ] Choose a tech stack (e.g., React + Vite or React Native Expo for mobile)
- [ ] Basic project scaffolding (`npm init`, ESLint/Prettier)
- [ ] Layout & navigation
  - [ ] Landing page: pick Rider vs Passenger role
  - [ ] "New Ride" page (Rider) – enter destination, toggle share live location
  - [ ] "Request Ride" page (Passenger) – set pickup, destination, walking radius
  - [ ] "Matches" page – list matching rides and simple status updates
- [ ] Map integration
  - [ ] Display current GPS location
  - [ ] Show pickup/destination pins
  - [ ] Show suggested meeting point after a match
- [ ] Forms & validation for all inputs
- [ ] API layer (e.g., `src/services/api.ts`) to call backend endpoints
- [ ] Real-time updates / notifications (simple polling or WebSocket client)
- [ ] Loading / error states and basic styling
- [ ] Build script & deployment to a static host (Netlify, Vercel, or Expo OTA)

## Backend

- [ ] Pick runtime & framework (Node.js + Express or Fastify)
- [ ] Project scaffolding, linter, testing setup (Jest)
- [ ] Auth (optional for MVP) – anonymous session or simple email sign-in
- [ ] REST (or GraphQL) endpoints
  - [ ] `POST /rides` – rider creates a ride
  - [ ] `GET /rides/:id` – ride details & live location
  - [ ] `POST /requests` – passenger requests a ride
  - [ ] `GET /requests/:id` – request status
  - [ ] `GET /matches?passengerId=` – find matching rides
- [ ] Location ingestion endpoint (`PATCH /rides/:id/location`) for rider GPS pings
- [ ] Matching service (simple geo-filter + bearing comparison)
- [ ] Notification service – emit "match found" events (HTTP long-poll or WebSocket)
- [ ] Data models: Rider, Passenger, Ride, Request, Match
- [ ] Persistence – choose DB (SQLite/Postgres/Firestore) and set up
- [ ] Unit tests for controllers / services
- [ ] Seed script with sample rides & requests
- [ ] API documentation (OpenAPI/Swagger)

## System Design / Infrastructure

- [ ] Decide on hosting (single VPS / Render / Railway / Heroku)
- [ ] Environment management – `.env` for API keys (maps, DB)
- [ ] Dockerize backend (optional but good practice)
- [ ] CI/CD – GitHub Actions to run tests & deploy
- [ ] Schema migrations (Prisma or knex)
- [ ] Logging & error monitoring (console + a basic service like Logtail)
- [ ] Simple rate limiting & CORS
- [ ] Map provider setup (Google Maps or Mapbox) – create API keys
- [ ] SSL & domain (if web) 