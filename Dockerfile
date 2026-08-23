# Multi-stage Dockerfile for React Frontend + Spring Boot + Stockfish UCI Engine
# 100% Compatible with Render.com Web Services Free & Paid Tiers

# ----------------------------------------------------
# Stage 1: Build React/Vite Frontend
# ----------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# ----------------------------------------------------
# Stage 2: Build Spring Boot JAR Application
# ----------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS backend-builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Copy static frontend assets built in Stage 1
COPY --from=frontend-builder /app/src/main/resources/static ./src/main/resources/static
RUN mvn clean package -DskipTests

# ----------------------------------------------------
# Stage 3: Production Execution Environment
# ----------------------------------------------------
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install Stockfish engine binary on Linux
RUN apt-get update && apt-get install -y stockfish && rm -rf /var/lib/apt/lists/*

# Copy compiled Spring Boot JAR artifact
COPY --from=backend-builder /app/target/chess-engine-0.0.1-SNAPSHOT.jar app.jar

# Render injects PORT dynamically (default 8080 or 10000)
ENV PORT=8080
EXPOSE 8080

# Launch application
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]

