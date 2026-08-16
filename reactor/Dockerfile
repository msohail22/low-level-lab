FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    cmake \
    ninja-build \
    build-essential \
    libstdc++-12-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cmake -S . -B build -G Ninja -DCMAKE_CXX_COMPILER=clang++ \
    && cmake --build build --target reactor

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    libstdc++6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/build/reactor /app/reactor

EXPOSE 18080

ENV PORT=18080
ENV REDIS_URL=redis://redis:6379

CMD ["/app/reactor"]
