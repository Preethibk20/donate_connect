# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline -B
COPY src src
RUN ./mvnw package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

ENV JAVA_TOOL_OPTIONS="-Xmx350m -XX:+UseSerialGC"
ENV SERVER_PORT="${PORT:-8080}"

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
