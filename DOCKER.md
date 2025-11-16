# Docker Configuration Explained

This document explains the Docker setup for the Fake News Detection application.

## What I've Created

### 1. Backend Dockerfile ([backend/Dockerfile](backend/Dockerfile))

**Multi-stage build** for optimal image size:

```dockerfile
Stage 1 (Builder):
- Base: python:3.12-slim
- Installs gcc/g++ for compiling Python packages
- Installs Python dependencies
- Creates isolated user environment

Stage 2 (Production):
- Base: python:3.12-slim (clean image)
- Copies only Python dependencies from builder
- Copies application code
- Creates directories for models and database
- Exposes port 8000
- Adds health check for container orchestration
- Runs uvicorn server
```

**Benefits:**
- Small final image size (~200MB instead of ~800MB)
- No build tools in production image (security)
- Fast container startup
- Health checks for AWS ECS/ALB

### 2. Frontend Dockerfile ([frontend/Dockerfile](frontend/Dockerfile))

**Multi-stage build** with nginx:

```dockerfile
Stage 1 (Builder):
- Base: node:18-alpine
- Installs npm dependencies
- Builds React app (npm run build)

Stage 2 (Production):
- Base: nginx:alpine (~23MB)
- Copies nginx configuration
- Copies built React app from builder
- Exposes port 80
- Health check endpoint
- Serves static files with nginx
```

**Benefits:**
- Tiny production image (~30MB)
- Fast serving with nginx
- Production-optimized React build
- Gzip compression enabled

### 3. Nginx Configuration ([frontend/nginx.conf](frontend/nginx.conf))

Features:
- **Gzip compression** - Reduces file sizes
- **Security headers** - XSS protection, frame options
- **Cache control** - 1 year for static assets
- **React Router support** - All routes serve index.html
- **Health check endpoint** - `/health` for load balancers

### 4. Docker Compose ([docker-compose.yml](docker-compose.yml))

**Development setup:**
```yaml
Services:
  - backend: Runs on port 8000
  - frontend: Runs on port 80

Features:
  - Environment variables from .env
  - Volume mounts for models (read-only)
  - Persistent volume for database
  - Health checks with dependencies
  - Automatic restart on failure
```

### 5. Dockerignore Files

**backend/.dockerignore:**
- Excludes `__pycache__`, `.env`, `*.db`
- Reduces image size
- Prevents secrets from being copied

**frontend/.dockerignore:**
- Excludes `node_modules`, `dist`, `.env`
- Only source code copied to builder

## How to Use Docker Locally

### Option 1: Docker Compose (Easiest)

```bash
# Make sure models are in place
ls models/
# Should see: RF_model.joblib, tfidf_vectorizer.joblib, speaker_label_encoder.joblib

# Create .env file or use .env.example
cp .env.example .env
# Edit .env with your values

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

**Access:**
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Option 2: Build Individual Images

```bash
# Build backend
cd backend
docker build -t fakenews-backend .

# Build frontend
cd frontend
docker build -t fakenews-frontend .

# Run backend
docker run -d -p 8000:8000 \
  -e SECRET_KEY=your-secret \
  -v $(pwd)/models:/app/models:ro \
  --name backend \
  fakenews-backend

# Run frontend
docker run -d -p 80:80 \
  -e VITE_API_URL=http://localhost:8000 \
  --name frontend \
  fakenews-frontend
```

## File Sizes

### Before Docker Optimization:
- Backend image: ~800MB
- Frontend image: ~1.2GB (with node_modules)

### After Multi-stage Build:
- Backend image: ~200MB
- Frontend image: ~30MB
- **Total savings: ~1.8GB**

## Health Checks

Both containers have health checks:

**Backend:**
```bash
# Checks if API is responding
curl http://localhost:8000/health
# Response: {"status":"healthy","model_loaded":true}
```

**Frontend:**
```bash
# Checks if nginx is serving
curl http://localhost/health
# Response: healthy
```

**Why this matters:**
- AWS ECS uses health checks to know when containers are ready
- Load balancers only send traffic to healthy containers
- Automatic restart of unhealthy containers

## Environment Variables

### Backend (.env):
```env
SECRET_KEY=<generate-secure-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DB_PATH=/app/data/prediction.db
CORS_ORIGINS=http://localhost:5173,http://localhost:80
```

### Frontend (.env):
```env
VITE_API_URL=http://localhost:8000
```

## Docker Volumes

**Named volume `backend-data`:**
- Persists SQLite database between container restarts
- Location in container: `/app/data/`
- Contains: `prediction.db`

**Bind mount for models:**
- Maps `./models` to `/app/models` (read-only)
- Allows updating models without rebuilding image

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check if ports are in use
netstat -an | grep 8000
netstat -an | grep 80
```

### Models not found
```bash
# Verify models exist
ls -la models/

# Check volume mount
docker inspect fakenews-backend | grep -A 10 Mounts
```

### Frontend can't connect to backend
```bash
# Check CORS settings in backend/.env
# Make sure CORS_ORIGINS includes your frontend URL

# Check network
docker network inspect assignment2_default
```

### Database permission issues
```bash
# Give write permissions to data volume
docker-compose down
docker volume rm assignment2_backend-data
docker-compose up -d
```

## Production Considerations

For AWS deployment, you'll need:

1. **ECR (Elastic Container Registry)**
   - Push images to ECR
   - Use IAM roles for authentication

2. **ECS (Elastic Container Service)**
   - Run containers on Fargate or EC2
   - Auto-scaling based on load

3. **ALB (Application Load Balancer)**
   - Routes traffic to containers
   - SSL termination
   - Health checks

4. **Secrets Manager**
   - Store SECRET_KEY and other secrets
   - Inject at runtime (not in image)

5. **S3 for Models**
   - Store large ML models in S3
   - Download at container startup
   - Reduces image size

Would you like me to create the AWS deployment documentation next?
