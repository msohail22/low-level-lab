#include <reactor/http_server.hpp>
#include <reactor/utils.hpp>

#include <httplib.h>
#include <spdlog/spdlog.h>

namespace reactor {

constexpr size_t MAX_SOURCE_BYTES = 200000;

HttpServer::HttpServer(int port, std::shared_ptr<RedisClient> redisClient, std::shared_ptr<CompilerEngine> compiler)
    : m_port(port), m_redis(std::move(redisClient)), m_compiler(std::move(compiler)) {
    m_server = std::make_unique<httplib::Server>();
}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::setupRoutes() {
    // CORS headers handler
    m_server->set_pre_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if (req.method == "OPTIONS") {
            res.status = 204;
            return httplib::Server::HandlerResponse::Handled;
        }
        return httplib::Server::HandlerResponse::Unhandled;
    });

    // GET /health
    m_server->Get("/health", [](const httplib::Request&, httplib::Response& res) {
        json j = {{"ok", true}};
        res.set_content(j.dump(), "application/json");
        res.status = 200;
    });

    // POST /v1/jobs
    m_server->Post("/v1/jobs", [this](const httplib::Request& req, httplib::Response& res) {
        try {
            json body = json::parse(req.body);
            std::string lang = body.value("language", "");
            std::string source = body.value("source", "");

            if (lang != "cpp" || source.empty()) {
                json err = {{"error", "INVALID_BODY"}, {"details", "Language must be 'cpp' and source must not be empty"}};
                res.set_content(err.dump(), "application/json");
                res.status = 400;
                return;
            }

            if (source.size() > MAX_SOURCE_BYTES) {
                json err = {{"error", "SOURCE_TOO_LARGE"}};
                res.set_content(err.dump(), "application/json");
                res.status = 400;
                return;
            }

            std::string nowStr = utils::getISO8601Timestamp();
            JobDocument job;
            job.id = utils::generateUUID();
            job.language = "cpp";
            job.source = source;
            job.status = "queued";
            job.createdAt = nowStr;
            job.updatedAt = nowStr;

            m_redis->saveJob(job);
            m_redis->pushJobQueue(job.id);

            spdlog::info("[HttpServer] Enqueued job: {}", job.id);

            json responseJson = {
                {"id", job.id},
                {"status", job.status}
            };
            res.set_content(responseJson.dump(), "application/json");
            res.status = 201;

        } catch (const std::exception& ex) {
            json err = {{"error", "INVALID_JSON"}, {"details", ex.what()}};
            res.set_content(err.dump(), "application/json");
            res.status = 400;
        }
    });

    // GET /v1/jobs/:id
    m_server->Get(R"(/v1/jobs/([a-zA-Z0-9\-]+))", [this](const httplib::Request& req, httplib::Response& res) {
        std::string jobId = req.matches[1];
        auto jobOpt = m_redis->getJob(jobId);

        if (!jobOpt.has_value()) {
            json err = {{"error", "NOT_FOUND"}};
            res.set_content(err.dump(), "application/json");
            res.status = 404;
            return;
        }

        json j = jobOpt.value();
        res.set_content(j.dump(), "application/json");
        res.status = 200;
    });
}

void HttpServer::processJob(const std::string& id) {
    auto jobOpt = m_redis->getJob(id);
    if (!jobOpt.has_value()) {
        spdlog::warn("[Worker] Missing job {}", id);
        return;
    }

    auto job = jobOpt.value();
    if (job.status != "queued") return;

    m_redis->updateJobStatus(id, "running");
    spdlog::info("[Worker] Executing job {}...", id);

    CompileRunResult execRes = m_compiler->compileAndRunCpp(job.source);

    JobResult jres;
    jres.stdoutStr = execRes.stdoutStr;
    jres.stderrStr = execRes.stderrStr;
    jres.exitCode = execRes.exitCode;
    jres.compiler = execRes.compiler;
    jres.durationMs = execRes.durationMs;

    m_redis->updateJobStatus(id, execRes.status, jres);
    spdlog::info("[Worker] Job {} completed -> status: {}", id, execRes.status);
}

void HttpServer::workerLoop() {
    spdlog::info("[Worker] Reactor worker loop started");
    while (m_running) {
        auto jobIdOpt = m_redis->popJobQueue(1);
        if (jobIdOpt.has_value()) {
            processJob(jobIdOpt.value());
        } else {
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
        }
    }
}

bool HttpServer::start() {
    setupRoutes();
    m_running = true;
    m_workerThread = std::thread(&HttpServer::workerLoop, this);

    spdlog::info("[Reactor] Starting C++ HTTP server listening on 0.0.0.0:{}", m_port);
    return m_server->listen("0.0.0.0", m_port);
}

void HttpServer::stop() {
    m_running = false;
    if (m_server) {
        m_server->stop();
    }
    if (m_workerThread.joinable()) {
        m_workerThread.join();
    }
}

} // namespace reactor
