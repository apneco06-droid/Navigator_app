import { ChangeEvent, useState } from "react";
import { programQuestionsMap, ProgramQuestion } from "../data/programQuestions";
import { IntakeForm, MatchResult } from "../lib/matching";

interface ProgramDetailIntakeProps {
  intake: IntakeForm;
  matches: MatchResult[];
  onChange: <Key extends keyof IntakeForm>(key: Key, value: IntakeForm[Key]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function ProgramDetailIntake({
  intake,
  matches,
  onChange,
  onBack,
  onContinue,
}: ProgramDetailIntakeProps) {
  const lang = intake.language;
  const isSpanish = lang === "es";

  const allMatches = matches.slice(0, 4);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeMatch = allMatches[activeIndex];

  const questions: ProgramQuestion[] = activeMatch
    ? (programQuestionsMap[activeMatch.program.id] ?? [])
    : [];

  const programName = activeMatch
    ? isSpanish
      ? activeMatch.program.nameEs
      : activeMatch.program.name
    : "";

  function handleText(
    field: keyof IntakeForm,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    onChange(field, event.target.value as IntakeForm[keyof IntakeForm]);
  }

  function handleChoice(field: keyof IntakeForm, value: string) {
    onChange(field, value as IntakeForm[keyof IntakeForm]);
  }

  return (
    <section className="panel mobile-panel">
      <div className="section-heading">
        <span className="eyebrow">
          {isSpanish ? "Detalles por programa" : "Program details"}
        </span>
        <h2>
          {isSpanish
            ? "Preguntas específicas por beneficio"
            : "Questions specific to each benefit"}
        </h2>
        <p>
          {isSpanish
            ? "Estas respuestas mejoran los formularios prellenados."
            : "These answers improve your prefilled forms."}
        </p>
      </div>

      <div className="delivery-toggle" role="tablist" aria-label="Program tabs">
        {allMatches.map((m, i) => (
          <button
            key={m.program.id}
            type="button"
            className={i === activeIndex ? "reply-chip active" : "reply-chip"}
            onClick={() => setActiveIndex(i)}
          >
            {isSpanish ? m.program.nameEs : m.program.name}
          </button>
        ))}
      </div>

      {activeMatch && (
        <div className="apply-stack">
          <article className="apply-card">
            <div className="apply-card-header">
              <div>
                <h3>{programName}</h3>
                <p>
                  {isSpanish
                    ? activeMatch.program.officeLabelEs
                    : activeMatch.program.officeLabel}
                </p>
              </div>
            </div>

            {questions.length === 0 ? (
              <p className="benefit-copy">
                {isSpanish
                  ? "No hay preguntas adicionales para este programa."
                  : "No additional questions for this program."}
              </p>
            ) : (
              <div className="official-form-grid">
                {questions.map((q) => {
                  const currentValue = String(intake[q.field] ?? "");

                  if (q.type === "choice" && q.options) {
                    return (
                      <fieldset key={String(q.field)} className="full-span">
                        <legend>{isSpanish ? q.labelEs : q.labelEn}</legend>
                        <div className="inline-choice-row">
                          {q.options.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={
                                currentValue === opt.value ? "reply-chip active" : "reply-chip"
                              }
                              onClick={() => handleChoice(q.field, opt.value)}
                            >
                              {isSpanish ? opt.labelEs : opt.labelEn}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    );
                  }

                  return (
                    <label key={String(q.field)} className="full-span">
                      <span>{isSpanish ? q.labelEs : q.labelEn}</span>
                      <input
                        value={currentValue}
                        onChange={(e) => handleText(q.field, e)}
                        placeholder={isSpanish ? q.placeholderEs : q.placeholderEn}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      )}

      <div className="conversation-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          {isSpanish ? "Atrás" : "Back"}
        </button>
        <button type="button" className="primary-button" onClick={onContinue}>
          {isSpanish ? "Ver solicitudes" : "View applications"}
        </button>
      </div>
    </section>
  );
}
