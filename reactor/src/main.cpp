#include <reactor/compiler.hpp>
#include <reactor/http_server.hpp>
#include <reactor/redis_client.hpp>

#include <csignal>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <spdlog/spdlog.h>

std::shared_ptr<reactor::HttpServer> g_server;

void signalHandler(int signum) {
    spdlog::info("[Main] Received signal {}, shutting down Reactor...", signum);
    if (g_server) {
        g_server->stop();
    }
    exit(0);
}

int main() {
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] %v");
    spdlog::info("=== Starting Native C++20 Reactor Execution Engine ===");

    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);

    int port = 18080;
    if (const char* portEnv = std::getenv("PORT")) {
        try {
            port = std::stoi(portEnv);
        } catch (...) {
            port = 18080;
        }
    }

    std::string redisUrl = "redis://127.0.0.1:6379";
    if (const char* redisEnv = std::getenv("REDIS_URL")) {
        redisUrl = redisEnv;
    }

    auto redis = std::make_shared<reactor::RedisClient>(redisUrl);
    redis->connect();

    auto compiler = std::make_shared<reactor::CompilerEngine>();
    g_server = std::make_shared<reactor::HttpServer>(port, redis, compiler);

    if (!g_server->start()) {
        spdlog::error("[Main] Failed to start Reactor HTTP server on port {}", port);
        return 1;
    }

    return 0;
}
