#pragma once

#include <reactor/types.hpp>
#include <string>

namespace reactor {

class CompilerEngine {
public:
    CompilerEngine() = default;

    CompileRunResult compileAndRunCpp(const std::string& source);
};

} // namespace reactor
