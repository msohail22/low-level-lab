import type { ComponentType } from "react";
import { Solution } from "./Solution";

/**
 * Components an MDX question may use without importing anything.
 * Add to this map, not to the MDX files.
 */
const components = { Solution };

export function QuestionBody({ Body }: { Body: ComponentType<any> }) {
  return (
    <div className="prose-q">
      <Body components={components} />
    </div>
  );
}
