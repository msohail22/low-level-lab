#include <spdlog/spdlog.h>

int main() {
    spdlog::set_pattern("[%H:%M:%S] [%^%l%$] %v");

    spdlog::info("Reactor started");
    spdlog::warn("This is a warning");
    spdlog::error("This is an error");

    return 0;
}
