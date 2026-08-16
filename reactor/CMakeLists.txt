cmake_minimum_required(VERSION 3.20)

project(Reactor VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Prefer Clang compiler if available
if(NOT CMAKE_CXX_COMPILER)
    find_program(CLANG_CPP_BIN clang++)
    if(CLANG_CPP_BIN)
        set(CMAKE_CXX_COMPILER ${CLANG_CPP_BIN})
    endif()
endif()

enable_testing()
include(FetchContent)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Header-only spdlog using C++20 std::format for clean compatibility with Clang 22
set(SPDLOG_HEADER_ONLY ON CACHE BOOL "" FORCE)
add_compile_definitions(SPDLOG_USE_STD_FORMAT=1)

# Vendored / External dependencies
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/vendors/spdlog/CMakeLists.txt")
    add_subdirectory(vendors/spdlog)
else()
    FetchContent_Declare(
        spdlog
        GIT_REPOSITORY https://github.com/gabime/spdlog.git
        GIT_TAG v1.15.0
    )
    FetchContent_MakeAvailable(spdlog)
endif()

if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/vendors/googletest/CMakeLists.txt")
    add_subdirectory(vendors/googletest)
else()
    FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG v1.14.0
    )
    FetchContent_MakeAvailable(googletest)
endif()

# Common library sources
set(REACTOR_LIB_SOURCES
    src/compiler.cpp
    src/http_server.cpp
    src/redis_client.cpp
    src/utils.cpp
)

add_library(reactor_lib STATIC ${REACTOR_LIB_SOURCES})
target_link_libraries(reactor_lib PRIVATE spdlog::spdlog_header_only)

# Main executable target
add_executable(reactor
    src/main.cpp
)

target_link_libraries(reactor
    PRIVATE
        reactor_lib
        spdlog::spdlog_header_only
        pthread
)

# Unit test executable target
add_executable(reactor_tests
    tests/test_main.cpp
)

target_link_libraries(reactor_tests
    PRIVATE
        reactor_lib
        spdlog::spdlog_header_only
        gtest_main
        pthread
)

include(GoogleTest)
gtest_discover_tests(reactor_tests)
