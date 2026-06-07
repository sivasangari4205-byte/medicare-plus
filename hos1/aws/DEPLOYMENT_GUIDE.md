# AWS Deployment Guide — MediCare+

## Prerequisites
- AWS CLI configured (`aws configure`)
- Docker installed
- ECR repository created

## Step 1 — Create ECR Repositories
```bash
aws ecr create-repository --repository-name medicare-backend --region ap-south-1
aws ecr create-repository --repository-name medicare-frontend --region ap-south-1
```

## Step 2 — Build & Push Docker Images
```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build and push backend
docker build -t medicare-backend ./backend
docker tag medicare-backend:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/medicare-backend:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/medicare-backend:latest

# Build and push frontend
docker build -t medicare-frontend ./frontend
docker tag medicare-frontend:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/medicare-frontend:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/medicare-frontend:latest
```

## Step 3 — Store Secrets in AWS Secrets Manager
```bash
aws secretsmanager create-secret --name medicare/jwt-secret --secret-string "your_jwt_secret"
aws secretsmanager create-secret --name medicare/jwt-refresh-secret --secret-string "your_refresh_secret"
aws secretsmanager create-secret --name medicare/mongodb-uri --secret-string "mongodb+srv://..."
aws secretsmanager create-secret --name medicare/razorpay-key-id --secret-string "rzp_live_..."
aws secretsmanager create-secret --name medicare/razorpay-key-secret --secret-string "..."
aws secretsmanager create-secret --name medicare/encryption-key --secret-string "..."
```

## Step 4 — Register ECS Task Definition
```bash
# Replace ACCOUNT_ID and REGION in aws/ecs-task-definition.json first
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
```

## Step 5 — Create ECS Cluster & Service
```bash
aws ecs create-cluster --cluster-name medicare-cluster

aws ecs create-service \
  --cluster medicare-cluster \
  --service-name medicare-backend-service \
  --task-definition medicare-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## Step 6 — GitHub Secrets Required
Set these in your GitHub repo → Settings → Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` = ap-south-1
- `AWS_ACCOUNT_ID`
