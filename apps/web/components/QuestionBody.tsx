import type { ComponentType, ReactNode } from "react";
import { Answer } from "./Answer";
import { Choices } from "./Choices";
import { TestCases } from "./TestCases";
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
  revealAnswers = false,
}: {
  Body: ComponentType<any>;
  question: Question;
  revealAnswers?: boolean;
}) {
  const components = {
    Answer: (props: { children: ReactNode }) => (
      <Answer defaultOpen={revealAnswers}>{props.children}</Answer>
    ),
    Choices: () => (
      <Choices choices={question.choices ?? []} multiple={question.kind === "multi"} />
    ),
    TestCases: () => <TestCases topic={question.topic} slug={question.slug} />,
  };

  return (
    <div className="prose-q">
      <Body components={components} />
    </div>
  );
}
