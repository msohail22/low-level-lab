#include <gtest/gtest.h>
#include <reactor/compiler.hpp>
#include <reactor/types.hpp>
#include <reactor/utils.hpp>

TEST(ReactorUtilsTest, UUIDGeneration) {
    std::string uuid1 = reactor::utils::generateUUID();
    std::string uuid2 = reactor::utils::generateUUID();
    EXPECT_EQ(uuid1.length(), 36);
    EXPECT_NE(uuid1, uuid2);
}

TEST(ReactorTypesTest, JSONSerialization) {
    reactor::JobDocument doc;
    doc.id = "test-uuid-123";
    doc.language = "cpp";
    doc.source = "int main() {}";
    doc.status = "succeeded";
    doc.createdAt = "2026-08-16T00:00:00.000Z";
    doc.updatedAt = "2026-08-16T00:00:01.000Z";

    reactor::JobResult res;
    res.stdoutStr = "Hello World\n";
    res.stderrStr = "";
    res.exitCode = 0;
    res.compiler = "clang++";
    res.durationMs = 42;
    doc.result = res;

    reactor::json j = doc;
    EXPECT_EQ(j["id"], "test-uuid-123");
    EXPECT_EQ(j["status"], "succeeded");
    EXPECT_EQ(j["result"]["stdout"], "Hello World\n");
    EXPECT_EQ(j["result"]["exitCode"], 0);

    reactor::JobDocument parsed = j.get<reactor::JobDocument>();
    EXPECT_EQ(parsed.id, doc.id);
    EXPECT_TRUE(parsed.result.has_value());
    EXPECT_EQ(parsed.result->stdoutStr, "Hello World\n");
}

TEST(ReactorCompilerTest, ValidCompilationAndExecution) {
    reactor::CompilerEngine engine;
    std::string src = R"(
#include <iostream>
int main() {
    std::cout << "Hello C++20 Native Reactor!";
    return 0;
}
)";
    auto res = engine.compileAndRunCpp(src);
    EXPECT_TRUE(res.ok);
    EXPECT_EQ(res.status, "succeeded");
    EXPECT_EQ(res.stdoutStr, "Hello C++20 Native Reactor!");
    EXPECT_EQ(res.exitCode.value_or(-1), 0);
}

TEST(ReactorCompilerTest, SyntaxErrorFailure) {
    reactor::CompilerEngine engine;
    std::string src = "int main() { syntax error here }";
    auto res = engine.compileAndRunCpp(src);
    EXPECT_FALSE(res.ok);
    EXPECT_EQ(res.status, "failed");
    EXPECT_FALSE(res.stderrStr.empty());
}

TEST(ReactorCompilerTest, ExecutionTimeout) {
    reactor::CompilerEngine engine;
    std::string src = R"(
int main() {
    while(true) {}
    return 0;
}
)";
    auto res = engine.compileAndRunCpp(src);
    EXPECT_FALSE(res.ok);
    EXPECT_EQ(res.status, "timed_out");
}
