import { AppShell } from "@/components/AppShell";
import { ReactorRunner } from "@/components/ReactorRunner";

export default function Playground() {
  return (
    <AppShell eyebrow="Reactor" title="Playground">
      <p className="section-copy mt-2">
        Submit C++ to the local Reactor (Kafka + Redis job queue). Code runs on
        the Reactor host, not on Cloudflare Workers.
      </p>
      <ReactorRunner />
    </AppShell>
  );
}
