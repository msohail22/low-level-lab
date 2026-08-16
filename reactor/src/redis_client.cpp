#include <reactor/redis_client.hpp>
#include <reactor/utils.hpp>

#include <arpa/inet.h>
#include <chrono>
#include <iostream>
#include <netdb.h>
#include <sys/socket.h>
#include <thread>
#include <unistd.h>
#include <spdlog/spdlog.h>

namespace reactor {

RedisClient::RedisClient(std::string redisUrl) : m_redisUrl(std::move(redisUrl)) {
    parseUrl();
}

RedisClient::~RedisClient() {
    disconnect();
}

bool RedisClient::parseUrl() {
    // Expected format: redis://host:port or redis://host
    std::string url = m_redisUrl;
    if (url.rfind("redis://", 0) == 0) {
        url = url.substr(8);
    }
    auto colonPos = url.find(':');
    if (colonPos != std::string::npos) {
        m_host = url.substr(0, colonPos);
        try {
            m_port = std::stoi(url.substr(colonPos + 1));
        } catch (...) {
            m_port = 6379;
        }
    } else if (!url.empty()) {
        m_host = url;
        m_port = 6379;
    }
    return true;
}

bool RedisClient::connect() {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_connected) return true;

    struct hostent* he = gethostbyname(m_host.c_str());
    if (!he) {
        spdlog::warn("[Redis] Cannot resolve host: {}", m_host);
        return false;
    }

    m_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (m_fd < 0) return false;

    struct sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(m_port);
    addr.sin_addr = *((struct in_addr*)he->h_addr_list[0]);

    // Socket timeout setting
    struct timeval tv;
    tv.tv_sec = 2;
    tv.tv_usec = 0;
    setsockopt(m_fd, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof(tv));
    setsockopt(m_fd, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof(tv));

    if (::connect(m_fd, (struct sockaddr*)&addr, sizeof(addr)) != 0) {
        close(m_fd);
        m_fd = -1;
        m_connected = false;
        spdlog::warn("[Redis] Could not connect to {}:{} (Using memory fallback queue)", m_host, m_port);
        return false;
    }

    m_connected = true;
    spdlog::info("[Redis] Connected successfully to {}:{}", m_host, m_port);
    return true;
}

void RedisClient::disconnect() {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_fd >= 0) {
        close(m_fd);
        m_fd = -1;
    }
    m_connected = false;
}

std::string RedisClient::sendCommand(const std::string& cmd) {
    if (!m_connected || m_fd < 0) return "";
    ssize_t sent = send(m_fd, cmd.c_str(), cmd.size(), 0);
    if (sent <= 0) {
        m_connected = false;
        return "";
    }
    char buf[4096];
    ssize_t recvd = recv(m_fd, buf, sizeof(buf) - 1, 0);
    if (recvd <= 0) {
        m_connected = false;
        return "";
    }
    buf[recvd] = '\0';
    return std::string(buf, recvd);
}

bool RedisClient::saveJob(const JobDocument& doc) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_fallbackJobs[doc.id] = doc;

    if (!m_connected) return true;

    json j = doc;
    std::string key = "reactor:job:" + doc.id;
    std::string val = j.dump();

    std::string redisCmd = "*3\r\n$3\r\nSET\r\n$" + std::to_string(key.size()) + "\r\n" + key +
                           "\r\n$" + std::to_string(val.size()) + "\r\n" + val + "\r\n";
    sendCommand(redisCmd);
    return true;
}

std::optional<JobDocument> RedisClient::getJob(const std::string& id) {
    std::lock_guard<std::mutex> lock(m_mutex);

    if (m_connected) {
        std::string key = "reactor:job:" + id;
        std::string redisCmd = "*2\r\n$3\r\nGET\r\n$" + std::to_string(key.size()) + "\r\n" + key + "\r\n";
        std::string resp = sendCommand(redisCmd);

        if (resp.rfind("$", 0) == 0 && resp.find("\r\n") != std::string::npos) {
            auto firstCr = resp.find("\r\n");
            int len = std::stoi(resp.substr(1, firstCr - 1));
            if (len > 0) {
                std::string jsonStr = resp.substr(firstCr + 2, len);
                try {
                    json j = json::parse(jsonStr);
                    JobDocument doc = j.get<JobDocument>();
                    return doc;
                } catch (...) {}
            }
        }
    }

    auto it = m_fallbackJobs.find(id);
    if (it != m_fallbackJobs.end()) {
        return it->second;
    }
    return std::nullopt;
}

bool RedisClient::updateJobStatus(const std::string& id, const std::string& status, const std::optional<JobResult>& result) {
    std::lock_guard<std::mutex> lock(m_mutex);

    auto it = m_fallbackJobs.find(id);
    if (it != m_fallbackJobs.end()) {
        it->second.status = status;
        it->second.updatedAt = utils::getISO8601Timestamp();
        if (result.has_value()) {
            it->second.result = result;
        }
    }

    if (!m_connected) return true;

    std::string key = "reactor:job:" + id;
    JobDocument doc;
    if (it != m_fallbackJobs.end()) {
        doc = it->second;
    } else {
        doc.id = id;
        doc.status = status;
        doc.updatedAt = utils::getISO8601Timestamp();
        doc.result = result;
    }

    json j = doc;
    std::string val = j.dump();
    std::string redisCmd = "*3\r\n$3\r\nSET\r\n$" + std::to_string(key.size()) + "\r\n" + key +
                           "\r\n$" + std::to_string(val.size()) + "\r\n" + val + "\r\n";
    sendCommand(redisCmd);
    return true;
}

bool RedisClient::pushJobQueue(const std::string& id) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_fallbackQueue.push_back(id);

    if (!m_connected) return true;

    std::string key = "reactor:queue";
    std::string redisCmd = "*3\r\n$5\r\nLPUSH\r\n$" + std::to_string(key.size()) + "\r\n" + key +
                           "\r\n$" + std::to_string(id.size()) + "\r\n" + id + "\r\n";
    sendCommand(redisCmd);
    return true;
}

std::optional<std::string> RedisClient::popJobQueue(int timeoutSec) {
    std::lock_guard<std::mutex> lock(m_mutex);

    if (!m_fallbackQueue.empty()) {
        std::string id = m_fallbackQueue.front();
        m_fallbackQueue.erase(m_fallbackQueue.begin());
        return id;
    }

    if (m_connected) {
        std::string key = "reactor:queue";
        std::string tStr = std::to_string(timeoutSec);
        std::string redisCmd = "*3\r\n$5\r\nRPOP\r\n$" + std::to_string(key.size()) + "\r\n" + key + "\r\n";
        std::string resp = sendCommand(redisCmd);

        if (resp.rfind("$", 0) == 0 && resp.find("\r\n") != std::string::npos) {
            auto firstCr = resp.find("\r\n");
            int len = std::stoi(resp.substr(1, firstCr - 1));
            if (len > 0) {
                return resp.substr(firstCr + 2, len);
            }
        }
    }

    return std::nullopt;
}

} // namespace reactor
