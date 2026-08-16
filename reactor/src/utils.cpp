#include <reactor/utils.hpp>

#include <chrono>
#include <cstdlib>
#include <ctime>
#include <fcntl.h>
#include <iomanip>
#include <iostream>
#include <random>
#include <sstream>
#include <sys/poll.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

namespace reactor::utils {

std::string generateUUID() {
    static std::random_device rd;
    static std::mt19937_64 gen(rd());
    static std::uniform_int_distribution<uint64_t> dis;

    uint64_t ab = dis(gen);
    uint64_t cd = dis(gen);

    // Set UUID v4 variant/version bits (64-bit masks)
    ab = (ab & 0xFFFFFFFFFFFF0FFFULL) | 0x0000000000004000ULL;
    cd = (cd & 0x3FFFFFFFFFFFFFFFULL) | 0x8000000000000000ULL;

    std::stringstream ss;
    ss << std::hex << std::setfill('0')
       << std::setw(8) << (ab >> 32) << "-"
       << std::setw(4) << ((ab >> 16) & 0xFFFF) << "-"
       << std::setw(4) << (ab & 0xFFFF) << "-"
       << std::setw(4) << (cd >> 48) << "-"
       << std::setw(12) << (cd & 0xFFFFFFFFFFFFULL);
    return ss.str();
}

std::string getISO8601Timestamp() {
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                  now.time_since_epoch()) % 1000;

    std::stringstream ss;
    std::tm buf{};
    gmtime_r(&in_time_t, &buf);
    ss << std::put_time(&buf, "%Y-%m-%dT%H:%M:%S")
       << '.' << std::setfill('0') << std::setw(3) << ms.count() << "Z";
    return ss.str();
}

std::optional<std::string> findExecutableOnPath(const std::string& name) {
    if (name.find('/') != std::string::npos) {
        if (access(name.c_str(), X_OK) == 0) return name;
        return std::nullopt;
    }

    const char* pathEnv = std::getenv("PATH");
    if (!pathEnv) pathEnv = "/usr/local/bin:/usr/bin:/bin";

    std::stringstream ss(pathEnv);
    std::string dir;
    while (std::getline(ss, dir, ':')) {
        if (dir.empty()) dir = ".";
        std::string fullPath = dir + "/" + name;
        if (access(fullPath.c_str(), X_OK) == 0) {
            return fullPath;
        }
    }
    return std::nullopt;
}

ExecResult runCommandWithTimeout(
    const std::string& cmd,
    const std::vector<std::string>& args,
    const std::string& cwd,
    int timeoutMs
) {
    ExecResult res;

    int outPipe[2];
    int errPipe[2];
    if (pipe(outPipe) != 0 || pipe(errPipe) != 0) {
        res.stderrStr = "Failed to create IPC pipes";
        return res;
    }

    pid_t pid = fork();
    if (pid < 0) {
        close(outPipe[0]); close(outPipe[1]);
        close(errPipe[0]); close(errPipe[1]);
        res.stderrStr = "Failed to fork child process";
        return res;
    }

    if (pid == 0) {
        // Child Process
        close(outPipe[0]);
        close(errPipe[0]);

        dup2(outPipe[1], STDOUT_FILENO);
        dup2(errPipe[1], STDERR_FILENO);
        close(outPipe[1]);
        close(errPipe[1]);

        if (!cwd.empty()) {
            if (chdir(cwd.c_str()) != 0) {
                _exit(127);
            }
        }

        // Apply resource limits for sandbox execution safety
        struct rlimit rlCpu;
        rlCpu.rlim_cur = 5; // 5 seconds CPU time max
        rlCpu.rlim_max = 5;
        setrlimit(RLIMIT_CPU, &rlCpu);

        struct rlimit rlFsize;
        rlFsize.rlim_cur = 10 * 1024 * 1024; // 10MB output file max
        rlFsize.rlim_max = 10 * 1024 * 1024;
        setrlimit(RLIMIT_FSIZE, &rlFsize);

        std::vector<char*> argv;
        argv.push_back(const_cast<char*>(cmd.c_str()));
        for (const auto& arg : args) {
            argv.push_back(const_cast<char*>(arg.c_str()));
        }
        argv.push_back(nullptr);

        execvp(cmd.c_str(), argv.data());
        _exit(127);
    }

    // Parent Process
    close(outPipe[1]);
    close(errPipe[1]);

    // Set non-blocking I/O on read ends
    fcntl(outPipe[0], F_SETFL, O_NONBLOCK);
    fcntl(errPipe[0], F_SETFL, O_NONBLOCK);

    struct pollfd fds[2];
    fds[0].fd = outPipe[0];
    fds[0].events = POLLIN;
    fds[1].fd = errPipe[0];
    fds[1].events = POLLIN;

    auto startTime = std::chrono::steady_clock::now();
    bool childRunning = true;
    bool timedOut = false;

    char buffer[4096];

    while (childRunning) {
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now() - startTime).count();

        if (elapsed >= timeoutMs) {
            timedOut = true;
            kill(pid, SIGKILL);
            break;
        }

        int remainingMs = timeoutMs - static_cast<int>(elapsed);
        if (remainingMs <= 0) remainingMs = 1;

        int pollRes = poll(fds, 2, std::min(remainingMs, 100));

        if (pollRes > 0) {
            if (fds[0].revents & POLLIN) {
                ssize_t bytes = read(outPipe[0], buffer, sizeof(buffer));
                if (bytes > 0) {
                    res.stdoutStr.append(buffer, bytes);
                }
            }
            if (fds[1].revents & POLLIN) {
                ssize_t bytes = read(errPipe[0], buffer, sizeof(buffer));
                if (bytes > 0) {
                    res.stderrStr.append(buffer, bytes);
                }
            }
        }

        int status = 0;
        pid_t waitRes = waitpid(pid, &status, WNOHANG);
        if (waitRes == pid) {
            childRunning = false;
            if (WIFEXITED(status)) {
                res.exitCode = WEXITSTATUS(status);
            } else if (WIFSIGNALED(status)) {
                res.exitCode = 128 + WTERMSIG(status);
            }
        } else if (waitRes < 0) {
            childRunning = false;
        }
    }

    if (timedOut) {
        int status = 0;
        waitpid(pid, &status, 0); // Cleanup zombie
        res.timedOut = true;
        res.exitCode = std::nullopt;
    } else {
        // Read remaining output
        ssize_t bytes;
        while ((bytes = read(outPipe[0], buffer, sizeof(buffer))) > 0) {
            res.stdoutStr.append(buffer, bytes);
        }
        while ((bytes = read(errPipe[0], buffer, sizeof(buffer))) > 0) {
            res.stderrStr.append(buffer, bytes);
        }
    }

    close(outPipe[0]);
    close(errPipe[0]);

    return res;
}

} // namespace reactor::utils
