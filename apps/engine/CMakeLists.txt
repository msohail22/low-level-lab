cmake_minimum_required(VERSION 3.15)

 project(quarantine-engine
  VERSION 0.1.0
  DESCRIPTION "Sandboxed execution engine"
  LANGUAGES CXX
 )
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(quarantine-engine src/main.cpp)
