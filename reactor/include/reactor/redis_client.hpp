#pragma once

#include <reactor/types.hpp>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>

namespace reactor {

class RedisClient {
public:
    RedisClient(std::string redisUrl);
    ~RedisClient();

    bool connect();
    void disconnect();

    bool saveJob(const JobDocument& doc);
    std::optional<JobDocument> getJob(const std::string& id);
    bool updateJobStatus(const std::string& id, const std::string& status, const std::optional<JobResult>& result = std::nullopt);

    bool pushJobQueue(const std::string& id);
    std::optional<std::string> popJobQueue(int timeoutSec = 5);

private:
    std::string m_redisUrl;
    std::string m_host{"127.0.0.1"};
    int m_port{6379};
    int m_fd{-1};
    bool m_connected{false};
    std::mutex m_mutex;

    // In-memory fallback map if Redis socket is offline
    std::unordered_map<std::string, JobDocument> m_fallbackJobs;
    std::vector<std::string> m_fallbackQueue;

    bool parseUrl();
    std::string sendCommand(const std::string& cmd);
};

} // namespace reactor
