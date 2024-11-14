# Stage 1: Build the frontend application
FROM node:18 AS frontend-build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy the built files from the previous stage
COPY --from=frontend-build /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Set the default command for the container
CMD ["nginx", "-g", "daemon off;"]
