cmake_minimum_required(VERSION 3.20)

project(Reactor VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

enable_testing()

# Dependencies
add_subdirectory(vendors/spdlog)
add_subdirectory(vendors/googletest)

# Main executable
add_executable(reactor
    src/main.cpp
)

target_link_libraries(reactor
    PRIVATE
        spdlog::spdlog
)

# Tests
add_executable(reactor_tests
    tests/test_main.cpp
)

target_link_libraries(reactor_tests
    PRIVATE
        GTest::gtest_main
)

include(GoogleTest)
gtest_discover_tests(reactor_tests)
