# Backend image. Build from the backend folder:  docker build -t samedesk-backend backend
# Base images are multi-arch (amd64 and arm64), so the same file works on Render and on an Arm server.

# ---- 1) Build the jar ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src

# Wrapper and pom first: dependencies stay cached until pom.xml changes.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# A Windows checkout may have CRLF line endings, which break the script on Linux.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src/ src/
# Tests run in CI and before merge; the image build only packages.
RUN ./mvnw -B -q -DskipTests package && cp target/backend-*.jar /src/app.jar

# ---- 2) Run ----
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY --from=build /src/app.jar app.jar
USER app

# Server settings: no local defaults, so DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET and
# CORS_ORIGINS must be set (see backend/README.md). The host may set PORT; 8080 otherwise.
#
# JVM flags for a small free machine (512 MB, a fraction of one CPU). Measured locally with
# --memory 512m --cpus 0.1: startup 216 s -> 127 s, memory 308 MB -> 249 MB.
#   TieredStopAtLevel=1  only the fast JIT compiler: quicker startup, a bit slower at peak
#   UseSerialGC          one GC thread, least overhead on one CPU
# Setting JAVA_TOOL_OPTIONS on the host replaces this whole line.
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
