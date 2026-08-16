#pragma once

#include <chrono>
#include <optional>
#include <string>
#include <vector>
#include <json.hpp>

namespace reactor {

using json = nlohmann::json;

struct JobResult {
    std::string stdoutStr;
    std::string stderrStr;
    std::optional<int> exitCode;
    std::string compiler;
    long long durationMs{0};
};

inline void to_json(json& j, const JobResult& res) {
    j = json{
        {"stdout", res.stdoutStr},
        {"stderr", res.stderrStr},
        {"exitCode", res.exitCode.has_value() ? json(*res.exitCode) : json(nullptr)},
        {"compiler", res.compiler},
        {"durationMs", res.durationMs}
    };
}

inline void from_json(const json& j, JobResult& res) {
    if (j.contains("stdout")) j.at("stdout").get_to(res.stdoutStr);
    if (j.contains("stderr")) j.at("stderr").get_to(res.stderrStr);
    if (j.contains("exitCode") && !j["exitCode"].is_null()) {
        res.exitCode = j.at("exitCode").get<int>();
    } else {
        res.exitCode = std::nullopt;
    }
    if (j.contains("compiler")) j.at("compiler").get_to(res.compiler);
    if (j.contains("durationMs")) j.at("durationMs").get_to(res.durationMs);
}

struct JobDocument {
    std::string id;
    std::string language{"cpp"};
    std::string source;
    std::string status{"queued"}; // queued, running, succeeded, failed, timed_out
    std::optional<JobResult> result;
    std::string createdAt;
    std::string updatedAt;
};

inline void to_json(json& j, const JobDocument& doc) {
    j = json{
        {"id", doc.id},
        {"language", doc.language},
        {"source", doc.source},
        {"status", doc.status},
        {"createdAt", doc.createdAt},
        {"updatedAt", doc.updatedAt}
    };
    if (doc.result.has_value()) {
        j["result"] = *doc.result;
    }
}

inline void from_json(const json& j, JobDocument& doc) {
    j.at("id").get_to(doc.id);
    if (j.contains("language")) j.at("language").get_to(doc.language);
    if (j.contains("source")) j.at("source").get_to(doc.source);
    if (j.contains("status")) j.at("status").get_to(doc.status);
    if (j.contains("createdAt")) j.at("createdAt").get_to(doc.createdAt);
    if (j.contains("updatedAt")) j.at("updatedAt").get_to(doc.updatedAt);
    if (j.contains("result") && !j["result"].is_null()) {
        doc.result = j["result"].get<JobResult>();
    }
}

struct CompileRunResult {
    bool ok{false};
    std::string status{"failed"}; // succeeded, failed, timed_out
    std::string stdoutStr;
    std::string stderrStr;
    std::optional<int> exitCode;
    std::string compiler;
    long long durationMs{0};
};

} // namespace reactor
