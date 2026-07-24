# Build stage: compile native deps (better-sqlite3) with a toolchain.
# node:20-alpine ships no musl prebuilt binary for better-sqlite3, so it must be
# built from source — which needs python3 + a C++ toolchain the base image
# lacks. Without this, `npm install` fails (node-gyp: "find Python could not be
# run").
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
# npm ci installs the exact tree from the committed package-lock.json, so
# every client build is reproducible. --omit=dev keeps the image lean;
# @11ty/eleventy is a runtime dependency (see src/build/rebuild.js), so it
# stays installed.
RUN npm ci --omit=dev

# Runtime stage: lean image, no build tools. The compiled better-sqlite3 binary
# rides along in node_modules (same base image → musl-compatible).
FROM node:20-alpine
WORKDIR /app
# Enables HSTS in server.js and disables dev-only behavior
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "src/server.js"]
