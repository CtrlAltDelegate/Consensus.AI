FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code
COPY backend/src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership and switch to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Start the backend application
CMD ["npm", "start"]