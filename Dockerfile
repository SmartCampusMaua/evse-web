# # Use the official Bun image
# FROM oven/bun:1 AS base
# WORKDIR /usr/src/app

# # Install dependencies into temp directory for caching
# FROM base AS install
# RUN mkdir -p /temp/dev
# COPY package.json bun.lockb /temp/dev/
# RUN cd /temp/dev && bun install --frozen-lockfile

# # Install with --production (exclude devDependencies)
# RUN mkdir -p /temp/prod
# COPY package.json bun.lockb /temp/prod/
# RUN cd /temp/prod && bun install --frozen-lockfile --production

# # Copy node_modules from temp directory then copy all project files into the image
# FROM base AS prerelease
# COPY --from=install /temp/dev/node_modules node_modules
# COPY . .

# # [optional] tests & build
# ENV NODE_ENV=production
# RUN bun test
# RUN bun run build

# # Copy production dependencies and source code into the final image
# FROM base AS release
# COPY --from=install /temp/prod/node_modules node_modules
# COPY --from=prerelease /usr/src/app/page.tsx .
# COPY --from=prerelease /usr/src/app/package.json .

# # Build the Next.js application
# RUN bun run build

# # Start the app
# USER bun
# EXPOSE 3000/tcp
# CMD ["bun", "start"]





FROM oven/bun AS base

# Install dependencies only when needed
FROM base AS deps

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:bun .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:bun /app/.next/standalone ./
COPY --from=builder --chown=nextjs:bun /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# ENV PORT=3000

# Set hostname to localhost
# ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
