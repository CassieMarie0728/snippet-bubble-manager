# builder stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# production stage
FROM node:20-alpine

RUN addgroup -g 1001 -S nonrootgroup && adduser -u 1001 -S nonroot -G nonrootgroup

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER nonroot

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
