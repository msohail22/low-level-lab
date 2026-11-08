import type { ComponentType } from "react";
import { Solution, Answer } from "./Solution";
import { Choices } from "./Choices";
import type { Question } from "@/lib/questions";

/**
 * Builds the component map an MDX question may use without importing anything.
 *
 * `<Choices />` takes no props in the MDX. The options live in frontmatter, so
 * the map binds them here. That keeps the options as validated data rather than
 * prose, which is what lets the validator prove an mcq has exactly one correct
 * answer.
 */
export function QuestionBody({
  Body,
  question,
}: {
  Body: ComponentType<any>;
  question: Question;
}) {
  const components = {
    Solution,
    Answer,
    Choices: () => (
      <Choices choices={question.choices ?? []} multiple={question.kind === "multi"} />
    ),
  };

  return (
    <div className="prose-q">
      <Body components={components} />
    </div>
  );
}
