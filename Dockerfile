# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY
ARG NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY=$NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY
ENV NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY=$NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

RUN npm run build

# Stage 2: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
