#include <spdlog/spdlog.h>
#include <cstdlib>
#include <string>
#include <chrono>

constexpr auto SOURCE_FILE = "yo.cpp";
constexpr auto OUTPUT_FILE = "yo";
constexpr auto COMPILER = "clang++";
constexpr auto COMPILE_FLAGS = "-std=c++17";


int main() {
    spdlog::set_pattern("[%H:%M:%S] [%^%l%$] %v");
    spdlog::info("Starting compilation...");

    std::string compileCommand =std::string(COMPILER) + " " + SOURCE_FILE + " " + " -o " + OUTPUT_FILE;

    auto start = std::chrono::steady_clock::now();

    int result = std::system(compileCommand.c_str());
   
    auto end = std::chrono::steady_clock::now();

    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    if (result == 0) {
      spdlog::info("Compilation successfull");  
    } else {
      spdlog::error("Compilation failed (exit code: {})", result);
    }

    spdlog::info("Compilation took {} ms", duration.count());

    return result;
}
