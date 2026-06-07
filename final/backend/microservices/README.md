# MediCare+ Microservices Architecture

This directory contains the microservices separation plan and standalone service stubs.
The current server.js is a modular monolith; each service here can be extracted into
an independent Node.js process behind NGINX and deployed separately on AWS ECS.

## Services

| Service               | Port  | Responsibility                                      |
|-----------------------|-------|-----------------------------------------------------|
| auth-service          | 5001  | Login, register, JWT issue, refresh token rotation  |
| appointment-service   | 5002  | Booking, prescriptions, video room creation         |
| payment-service       | 5003  | Razorpay orders, subscriptions, invoice generation  |
| notification-service  | 5004  | Socket.IO real-time events, email/SMS notifications |
| pharmacy-service      | 5005  | Medicine orders, inventory                          |
| lab-service           | 5006  | Lab report upload, doctor review                    |

## Communication
- REST HTTP between services (via internal NGINX)
- Socket.IO for real-time events (notification-service)
- Shared MongoDB (can be split to per-service DBs)

## To extract a service
1. Copy relevant routes from server.js into the service directory
2. Add its own package.json, Dockerfile
3. Add to docker-compose.yml as a new container
4. Update NGINX upstream config
