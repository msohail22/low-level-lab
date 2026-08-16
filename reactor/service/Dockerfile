FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends clang g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

ENV PORT=18080
ENV REDIS_URL=redis://redis:6379
ENV KAFKA_BROKERS=kafka:9092
ENV CORS_ORIGIN=*

EXPOSE 18080

CMD ["npx", "tsx", "src/index.ts"]
