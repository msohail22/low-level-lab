#pragma once

#include <optional>
#include <string>
#include <vector>

namespace reactor::utils {

std::string generateUUID();
std::string getISO8601Timestamp();
std::optional<std::string> findExecutableOnPath(const std::string& name);

struct ExecResult {
    std::string stdoutStr;
    std::string stderrStr;
    std::optional<int> exitCode;
    bool timedOut{false};
};

ExecResult runCommandWithTimeout(
    const std::string& cmd,
    const std::vector<std::string>& args,
    const std::string& cwd,
    int timeoutMs
);

} // namespace reactor::utils
