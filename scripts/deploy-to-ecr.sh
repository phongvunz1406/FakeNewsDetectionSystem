#!/bin/bash
# Deploy Docker images to AWS ECR
# Usage: ./scripts/deploy-to-ecr.sh <aws-region> <aws-account-id>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Usage: $0 <aws-region> <aws-account-id>${NC}"
    echo "Example: $0 us-east-1 123456789012"
    exit 1
fi

AWS_REGION=$1
AWS_ACCOUNT_ID=$2
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG=${IMAGE_TAG:-latest}

echo -e "${GREEN}Starting deployment to ECR...${NC}"
echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Image Tag: $IMAGE_TAG"

# Authenticate Docker to ECR
echo -e "${YELLOW}Authenticating to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Create ECR repositories if they don't exist
echo -e "${YELLOW}Creating ECR repositories...${NC}"
aws ecr describe-repositories --repository-names fakenews-backend --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name fakenews-backend --region $AWS_REGION

aws ecr describe-repositories --repository-names fakenews-frontend --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name fakenews-frontend --region $AWS_REGION

# Build and push backend image
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t fakenews-backend:$IMAGE_TAG ./backend
docker tag fakenews-backend:$IMAGE_TAG $ECR_REGISTRY/fakenews-backend:$IMAGE_TAG
docker tag fakenews-backend:$IMAGE_TAG $ECR_REGISTRY/fakenews-backend:latest

echo -e "${YELLOW}Pushing backend image...${NC}"
docker push $ECR_REGISTRY/fakenews-backend:$IMAGE_TAG
docker push $ECR_REGISTRY/fakenews-backend:latest

# Build and push frontend image
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -t fakenews-frontend:$IMAGE_TAG ./frontend
docker tag fakenews-frontend:$IMAGE_TAG $ECR_REGISTRY/fakenews-frontend:$IMAGE_TAG
docker tag fakenews-frontend:$IMAGE_TAG $ECR_REGISTRY/fakenews-frontend:latest

echo -e "${YELLOW}Pushing frontend image...${NC}"
docker push $ECR_REGISTRY/fakenews-frontend:$IMAGE_TAG
docker push $ECR_REGISTRY/fakenews-frontend:latest

echo -e "${GREEN}✓ Deployment to ECR completed successfully!${NC}"
echo ""
echo "Backend image: $ECR_REGISTRY/fakenews-backend:$IMAGE_TAG"
echo "Frontend image: $ECR_REGISTRY/fakenews-frontend:$IMAGE_TAG"
