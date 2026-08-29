# Stage 1: Build the Maven application
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies
RUN mvn dependency:go-offline -B
COPY src ./src
# Build production executable JAR
RUN mvn package -DskipTests

# Stage 2: Minimal Java 21 Runtime Environment
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy built artifact from Stage 1
COPY --from=build /app/target/*.jar app.jar

# Expose default Spring Boot web port
EXPOSE 8080

# Configure Environment Variables
ENV DB_URL=jdbc:postgresql://localhost:5432/donateconnect
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=postgres
ENV JWT_SECRET=donateConnectSecretKey32BytesLongString123!

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
