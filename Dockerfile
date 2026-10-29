# 키트 규칙: 의존성 설치·빌드는 여기서 끝내고, 컨테이너 시작 명령은 서버 실행만 한다.
# 주최 측 실행은 app에 CPU 2개·메모리 4GB를 주고, 기동부터 /__health 200까지 2분 안이어야 한다.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# 주최 측 실행·CI가 넣는 실제 commit SHA. /__health의 releaseId로 응답한다.
ARG RELEASE_ID=dev
ENV RELEASE_ID=$RELEASE_ID
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
