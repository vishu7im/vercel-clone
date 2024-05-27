### Setup Guide

This Project contains following services and folders:

- `api-server`: HTTP API Server for REST API's
- `build-server`: Docker Image code which clones, builds and pushes the build to S3
- `s3-reverse-proxy`: Reverse Proxy the subdomains and domains to s3 bucket static assets
- `client`: frontend of over vercel-clone 

### Local Setup

1. Run `npm install` in all the 4 services i.e. `api-server`, `build-server`, `s3-reverse-proxy` and `client`
2. Docker build the `build-server` and push the image to AWS ECR.
3. Setup the `api-server` by providing all the required config such as TASK ARN and CLUSTER arn.
4. Run `node index.js` in `api-server` and `s3-reverse-proxy`
5. Run `npm run dev` in `client` 

At this point following services would be up and running:

| S.No | Service            | PORT    |
| ---- | ------------------ | ------- |
| 1    | `api-server`       | `:9000` |
| 2    | `socket.io-server` | `:9002` |
| 3    | `s3-reverse-proxy` | `:8000` |
| 4    | `client`           | `:3000` |

### Architecture

![Vercel Clone Architecture](https://i.imgur.com/r7QUXqZ.png)
