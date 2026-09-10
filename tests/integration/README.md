# Integration tests

Run `npm run build`, then `npm run test:integration`. The Network & Content Core suite uses in-memory PostgreSQL on local ports 55439 and 3109, applies migrations over legacy fixtures, and verifies the production HTTP routes, authentication/authorization, content CRUD and publication visibility. It never uses the configured Neon DATABASE_URL.
