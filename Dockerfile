# Multi-stage Dockerfile for Spring Boot + Stockfish
# 100% Compatible with Render.com, Railway.app, Koyeb, and Fly.io Free Tiers

# Stage 1: Build Java Application
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production Execution Environment
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install Stockfish engine binary on Linux
RUN apt-get update && apt-get install -y stockfish && rm -rf /var/lib/apt/lists/*

# Copy compiled Spring Boot JAR artifact
COPY --from=builder /app/target/chess-engine-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080

# Launch application
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
