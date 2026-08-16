#include <reactor/compiler.hpp>
#include <reactor/utils.hpp>

#include <chrono>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>

namespace reactor {

CompileRunResult CompilerEngine::compileAndRunCpp(const std::string& source) {
    auto startTime = std::chrono::steady_clock::now();
    CompileRunResult res;

    // Locate clang++ first as required by repo rules, fallback to g++
    auto compilerPathOpt = utils::findExecutableOnPath("clang++");
    if (!compilerPathOpt.has_value()) {
        compilerPathOpt = utils::findExecutableOnPath("g++");
    }

    if (!compilerPathOpt.has_value()) {
        res.ok = false;
        res.status = "failed";
        res.stderrStr = "No clang++ or g++ found on system PATH.";
        res.compiler = "none";
        res.durationMs = 0;
        return res;
    }

    std::string compilerBin = compilerPathOpt.value();
    res.compiler = (compilerBin.find("clang") != std::string::npos) ? "clang++" : "g++";

    // Create unique temporary workspace directory
    std::string tmpTemplate = (std::filesystem::temp_directory_path() / "llb-reactor-XXXXXX").string();
    std::vector<char> tmpDirBuf(tmpTemplate.begin(), tmpTemplate.end());
    tmpDirBuf.push_back('\0');

    char* createdDir = mkdtemp(tmpDirBuf.data());
    if (!createdDir) {
        res.ok = false;
        res.status = "failed";
        res.stderrStr = "Failed to create temporary directory for compilation.";
        return res;
    }

    std::filesystem::path dirPath(createdDir);
    std::filesystem::path srcPath = dirPath / "main.cpp";
    std::filesystem::path binPath = dirPath / "a.out";

    try {
        // Write C++ source code to main.cpp
        {
            std::ofstream srcFile(srcPath);
            if (!srcFile.is_open()) {
                throw std::runtime_error("Could not write main.cpp");
            }
            srcFile << source;
        }

        // 1. Compilation step (C++20 standard, 15s timeout)
        std::vector<std::string> compileArgs = {
            "-std=c++20",
            "-O0",
            srcPath.string(),
            "-o",
            binPath.string()
        };

        auto compileExec = utils::runCommandWithTimeout(compilerBin, compileArgs, dirPath.string(), 15000);

        if (compileExec.timedOut) {
            res.ok = false;
            res.status = "timed_out";
            res.stdoutStr = compileExec.stdoutStr;
            res.stderrStr = compileExec.stderrStr.empty() ? "Compilation timed out after 15s." : compileExec.stderrStr;
            res.exitCode = std::nullopt;
            auto endTime = std::chrono::steady_clock::now();
            res.durationMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
            std::filesystem::remove_all(dirPath);
            return res;
        }

        if (!compileExec.exitCode.has_value() || compileExec.exitCode.value() != 0) {
            res.ok = false;
            res.status = "failed";
            res.stdoutStr = compileExec.stdoutStr;
            res.stderrStr = compileExec.stderrStr;
            res.exitCode = compileExec.exitCode;
            auto endTime = std::chrono::steady_clock::now();
            res.durationMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
            std::filesystem::remove_all(dirPath);
            return res;
        }

        // 2. Binary Execution step (3s timeout)
        auto runExec = utils::runCommandWithTimeout(binPath.string(), {}, dirPath.string(), 3000);

        auto endTime = std::chrono::steady_clock::now();
        res.durationMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

        if (runExec.timedOut) {
            res.ok = false;
            res.status = "timed_out";
            res.stdoutStr = runExec.stdoutStr;
            res.stderrStr = runExec.stderrStr.empty() ? "Execution timed out after 3s." : runExec.stderrStr;
            res.exitCode = std::nullopt;
        } else {
            res.ok = (runExec.exitCode.has_value() && runExec.exitCode.value() == 0);
            res.status = res.ok ? "succeeded" : "failed";
            res.stdoutStr = runExec.stdoutStr;
            res.stderrStr = runExec.stderrStr;
            res.exitCode = runExec.exitCode;
        }

    } catch (const std::exception& ex) {
        res.ok = false;
        res.status = "failed";
        res.stderrStr = std::string("Internal Error: ") + ex.what();
    }

    std::filesystem::remove_all(dirPath);
    return res;
}

} // namespace reactor
