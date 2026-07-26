# Low-Level Lab

## Local SonarQube

Run a local SonarQube Community Build server and scan the repository:

```sh
pnpm sonar:up
```

Wait for the server to finish starting, then open [http://localhost:9000](http://localhost:9000) and sign in with `admin` / `admin`. Change the default password when prompted, then create a project token for `low-level-lab` and run:

```sh
export SONAR_TOKEN="your-project-token"
pnpm sonar:scan
```

The results are available at [http://localhost:9000/dashboard?id=low-level-lab](http://localhost:9000/dashboard?id=low-level-lab). Use `pnpm sonar:logs` while the server starts, and `pnpm sonar:down` to stop it. The Docker volumes preserve the database and SonarQube data; do not use `down -v` unless you intentionally want to erase the local SonarQube instance.

url: https://low-level-lab-web.msohail22.workers.dev

## Cloudflare Products

- kv
- r2
- d1
- queues
- workflows
- emails
- durable-objects
- browser run
- worker vpc - for running the code
- flagship - for feature flags
- workers ai
- ai gateway
- vectorize
- ai search
- cloudflare models
- analytics engine
- streams
- images transformations (can be use to serve the images for the mobile app)
- RealtimeKit → build real-time apps
- TURN → fix connectivity issues
- SFU → scale video calls
- MoQ → low-latency streaming
- turnstile - cloudflare captcha
