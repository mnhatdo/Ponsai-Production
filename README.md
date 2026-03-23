# Ponsai Production

Ponsai Production is a full-stack commerce platform built for a practical production flow on free-tier infrastructure.

Core stack:
- Frontend: Angular 17 (standalone components, route lazy loading)
- Backend: Node.js, Express, TypeScript
- Database: MongoDB (Atlas compatible)
- Optional service: Python ML forecasting

## Project Scope

This repository contains:
- Customer storefront and checkout flow
- Admin operations modules
- Authentication and authorization APIs
- Payment-related backend routes and integrations
- Documentation, deployment runbooks, and CI quality gates

## Repository Structure

- frontend: Angular application
- backend: Express API server
- shared: Shared TypeScript package
- ml-service: Optional forecasting service
- docs: Technical and operational documentation

## Local Development

Prerequisites:
- Node.js >= 18
- npm >= 9
- MongoDB local or Atlas

Install dependencies:

```bash
npm run install:all
```

Run both frontend and backend:

```bash
npm run dev
```

Default local endpoints:
- Frontend: http://localhost:4200
- Backend: http://localhost:3000
- Health: http://localhost:3000/health
- Readiness: http://localhost:3000/readyz

Run checks:

```bash
npm run build
npm test
```

## Production Deployment Baseline

Recommended setup for this repository:
- Frontend hosting: Vercel
- Backend hosting: Render Web Service
- Database: MongoDB Atlas
- Uptime monitor: UptimeRobot pinging `/readyz`

Relevant deployment files:
- Render blueprint: render.yaml
- Vercel SPA/caching config: frontend/vercel.json

Required environment variables on backend:
- NODE_ENV=production
- MONGODB_URI
- JWT_SECRET
- CORS_ORIGIN
- API_PREFIX=/api
- API_VERSION=v1

Frontend production API endpoint is configured in:
- frontend/src/environments/environment.prod.ts

Replace the placeholder Render URL before release.

## Quality and Stability

Current baseline includes:
- CI workflow for lint, build, test across backend, frontend, shared
- Backend readiness endpoint for health probing
- Route-level rate limiting on authentication and payment endpoints
- Runtime hardening for production error handling
- Frontend UX optimization with route preloading, lazy image loading, and list render optimization

CI workflow path:
- .github/workflows/ci.yml

## Documentation Index

- docs/DEPLOYMENT.md
- docs/API.md
- docs/ARCHITECTURE.md
- docs/FRONTEND.md
- docs/INDEX.md
- QUICK_START.md
- FORECAST_QUICKSTART.md

## License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

**Original Template**: Ponsai by [Untree.co](https://untree.co/)  
**Developed by**: Ki8 Development Team  
**Last Updated**: January 8, 2026

