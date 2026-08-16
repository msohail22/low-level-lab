#pragma once

#include <reactor/compiler.hpp>
#include <reactor/redis_client.hpp>
#include <atomic>
#include <memory>
#include <string>
#include <thread>

namespace httplib {
class Server;
}

namespace reactor {

class HttpServer {
public:
    HttpServer(int port, std::shared_ptr<RedisClient> redisClient, std::shared_ptr<CompilerEngine> compiler);
    ~HttpServer();

    bool start();
    void stop();

    void processJob(const std::string& id);

private:
    int m_port;
    std::shared_ptr<RedisClient> m_redis;
    std::shared_ptr<CompilerEngine> m_compiler;
    std::unique_ptr<httplib::Server> m_server;
    std::atomic<bool> m_running{false};
    std::thread m_workerThread;

    void setupRoutes();
    void workerLoop();
};

} // namespace reactor
