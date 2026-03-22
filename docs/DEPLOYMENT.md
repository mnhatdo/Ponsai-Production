# Deployment Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0 (local or cloud)
- Git

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd deploy
```

### 2. Install Dependencies

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all
```

### 3. Environment Configuration

#### Backend Environment

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
HOST=localhost

MONGODB_URI=mongodb://localhost:27017/furni
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:4200
```

#### Frontend Environment

Frontend environments are in `frontend/src/environments/`:
- `environment.ts` - Development
- `environment.prod.ts` - Production

Default development API URL: `http://localhost:3000/api/v1`

### 4. Start Development Servers

**Option A: Run both concurrently**
```bash
npm run dev
```

**Option B: Run separately**

Terminal 1 (Backend):
```bash
npm run dev:backend
# or: cd backend && npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
# or: cd frontend && npm start
```

### 5. Access Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/health
- **Readiness Check**: http://localhost:3000/readyz

---

## Production Build

### Build Frontend

```bash
cd frontend
npm run build
```

Output: `frontend/dist/ponsai-frontend/`

### Build Backend

```bash
cd backend
npm run build
```

Output: `backend/dist/`

### Build Both

```bash
npm run build
```

---

## Production Deployment

### Option 1: Traditional Server (VPS/EC2)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
# See: https://docs.mongodb.com/manual/installation/

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd deploy

# Install dependencies
npm run install:all

# Build application
npm run build

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values
```

#### 3. Run with PM2

```bash
# Start backend
cd backend
pm2 start dist/server.js --name furni-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 4. Serve Frontend

Use **Nginx** to serve Angular build:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/deploy/frontend/dist/ponsai-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Option 2: Docker Deployment

#### Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/ponsai-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/furni
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

**Run:**
```bash
docker-compose up -d
```

---

### Option 3: Cloud Platform (Free-tier aware)

### Recommended Stack for This Project

- Frontend: Vercel (free static hosting + global CDN)
- Backend: Render Web Service (free tier, Node runtime)
- Database: MongoDB Atlas (M0 free tier)
- Keep-awake monitor: UptimeRobot ping `/readyz` every 5 minutes

#### A. Deploy Backend to Render

1. Push repository to GitHub.
2. In Render, create a new Web Service from this repository.
3. Render can auto-detect from `render.yaml` in repository root.
4. Configure required environment variables in Render dashboard:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/furni
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://<your-vercel-project>.vercel.app
```

5. Verify health after deploy:
  - `GET /health`
  - `GET /readyz`

#### B. Deploy Frontend to Vercel

1. Import `frontend` directory as Vercel project.
2. Build command: `npm run build`
3. Output directory: `dist/ponsai-frontend`
4. Before production release, update API endpoint in `frontend/src/environments/environment.prod.ts`:

```typescript
apiUrl: 'https://<your-render-service>.onrender.com/api/v1'
```

5. Keep `frontend/vercel.json` committed for SPA rewrite and cache headers.

#### C. MongoDB Atlas Setup

1. Create Atlas M0 cluster.
2. Add Render outbound IP access rule (or temporary `0.0.0.0/0` during setup).
3. Create DB user with least privilege.
4. Put Atlas connection string into Render `MONGODB_URI`.

#### D. UptimeRobot (Reduce Sleep Impact)

- Add HTTP monitor to `https://<your-render-service>.onrender.com/readyz`
- Interval: 5 minutes
- Expect status code: 200

Note:
- Free Render services can still cold-start under platform constraints.
- UptimeRobot reduces frequency of sleep but cannot guarantee absolute always-on.

#### Frontend (Vercel/Netlify)

**Vercel:**
```bash
cd frontend
vercel --prod
```

**Netlify:**
```bash
cd frontend
netlify deploy --prod --dir=dist/ponsai-frontend
```

#### Backend (Free-tier caveat)

- Free backend platforms usually have sleep/cold-start behavior.
- If you require always-on and no cold-start, use Option 1 with a low-cost VPS.
- For strict zero-cost, accept cold-start trade-offs and monitor response latency.

---

### Option 4: MongoDB Atlas (Cloud Database)

1. Create account: https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/furni?retryWrites=true&w=majority
```

---

## Environment Variables Reference

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/furni` |
| `JWT_SECRET` | JWT signing key | `random-secret-key` |
| `JWT_EXPIRE` | Token expiry | `7d` |
| `CORS_ORIGIN` | Allowed origin | `https://yourdomain.com` |

### Frontend

Edit `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api/v1'
};
```

---

## Post-Deployment Checklist

- [ ] Database connection verified
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] CORS settings correct
- [ ] API endpoints accessible
- [ ] `GET /health` and `GET /readyz` return expected status
- [ ] Frontend routing works (refresh on any page)
- [ ] Static assets loading correctly
- [ ] Authentication flow working
- [ ] Error monitoring configured
- [ ] Backups scheduled
- [ ] Performance monitoring enabled
- [ ] Security headers verified

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
pm2 monit                    # Real-time monitoring
pm2 logs furni-api          # View logs
pm2 restart furni-api       # Restart app
pm2 stop furni-api          # Stop app
```

### CI Quality Gates

- Repository includes CI workflow at `.github/workflows/ci.yml`.
- Required checks before merge/deploy:
  - Backend: lint, build, test
  - Frontend: lint, build, test
  - Shared: build

### Database Backup

```bash
# MongoDB dump
mongodump --db furni --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --db furni /backup/20251231/furni
```

### Logs

- **Backend logs**: Check PM2 logs or application logs
- **Nginx logs**: `/var/log/nginx/access.log`, `error.log`
- **MongoDB logs**: `/var/log/mongodb/mongod.log`

---

## Troubleshooting

### Backend won't start

1. Check MongoDB is running: `sudo systemctl status mongod`
2. Verify `.env` file exists and has correct values
3. Check port 3000 isn't in use: `lsof -i :3000`
4. Review logs: `pm2 logs furni-api`
5. Check readiness endpoint: `curl http://localhost:3000/readyz`

### Render error: `Cannot find module '/opt/render/project/src/index.js'`

If Render logs show `Running 'node index.js'` and then module-not-found:

1. Ensure service root is `backend` (or keep root and use provided fallback `index.js`).
2. Set Build Command to: `npm ci && npm run build`
3. Set Start Command to: `npm start`
4. Confirm `render.yaml` is detected from repository root.

If Render does not use blueprint settings, configure Build/Start manually in dashboard.

### Platform auto-upgraded Node to v25

This repository pins Node to 20.x in package `engines`.
If platform still uses another version, set runtime manually:

- Render: set environment variable `NODE_VERSION=20`
- Vercel: Project Settings -> General -> Node.js Version -> `20.x`

### Frontend shows API errors

1. Verify backend is running and accessible
2. Check CORS settings in backend
3. Verify `environment.prod.ts` has correct API URL
4. Check browser console for specific errors

### Database connection fails

1. Verify MongoDB is running
2. Check `MONGODB_URI` format
3. Ensure network connectivity
4. Check MongoDB Atlas IP whitelist (if using Atlas)

---

## Rollback Procedure

### PM2 Deployment

```bash
# Stop current version
pm2 stop furni-api

# Restore previous code
git checkout <previous-commit>

# Rebuild
npm run build

# Restart
pm2 restart furni-api
```

### Docker

```bash
# Use previous image
docker-compose down
docker-compose up -d <previous-tag>
```

---

## Free-tier Feasibility Matrix

| Requirement | Fully Free | Notes |
|------------|------------|-------|
| Frontend static hosting | Yes | Vercel/Netlify/Cloudflare Pages free tiers |
| Backend always-on, no sleep | No (practically) | Most free backend tiers introduce idle sleep/cold-start |
| No cold-start UX impact | No (with strict zero budget) | Use low-cost VPS if this is non-negotiable |
| Smooth production UX | Partial | Requires CDN/cache optimization and non-sleeping backend |

Recommendation:
- If strict zero-cost: choose free-tier backend and accept cold-start trade-offs.
- If strict no-sleep/cold-start: choose Option 1 with low-cost VPS and free CDN/SSL tooling.

---

**Last Updated**: March 22, 2026
