# PDF Tools v2 — TanStack Start + Nitro production image
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build
# Adobe bridge is loaded at runtime via require() from the Nitro bundle (not inlined).
RUN mkdir -p .output/server/_ssr/lib \
  && cp src/server/adobe-bridge.cjs .output/server/_ssr/adobe-bridge.cjs \
  && cp -R src/server/lib/. .output/server/_ssr/lib/

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.output ./.output

RUN mkdir -p tmp && chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
