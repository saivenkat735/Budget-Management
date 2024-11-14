# Use Maven image to build the application
FROM maven:3.9.0-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Use an official OpenJDK runtime as a parent image for the final stage
FROM eclipse-temurin:17

# Set the working directory in the container
WORKDIR /app

# Copy the JAR file from the build stage into the container

COPY --from=build /app/target/secure-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the app runs on
EXPOSE 9099

# Run the JAR file
ENTRYPOINT ["java", "-jar", "app.jar"]







