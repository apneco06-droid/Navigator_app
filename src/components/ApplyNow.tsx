import { useMemo } from "react";
import { buildApplicationDrafts } from "../lib/applicationDrafts";
import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";
import { getSubmissionInfo } from "../data/submissionInfo";

interface ApplyNowProps {
  intake: IntakeFormValue;
  matches: MatchResult[];
}

export function ApplyNow({ intake, matches }: ApplyNowProps) {
  const applicationDrafts = useMemo(
    () => buildApplicationDrafts(intake, matches),
    [intake, matches],
  );
  const isSpanish = intake.language === "es";

  function handleOnline(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="panel mobile-panel">
      <div className="section-heading">
        <span className="eyebrow">{isSpanish ? "Aplicar ahora" : "Apply now"}</span>
        <h2>{isSpanish ? "Solicitudes por beneficio" : "Applications by benefit"}</h2>
        <p>
          {isSpanish
            ? "Accede al portal oficial o visita la oficina con la informacion de abajo."
            : "Open the official portal or visit the office using the contact info below."}
        </p>
      </div>

      <div className="apply-stack">
        {applicationDrafts.map((draft) => {
          const sub = getSubmissionInfo(draft.id);
          return (
            <article key={draft.id} className="apply-card">
              <div className="apply-card-header">
                <div>
                  <h3>{draft.title}</h3>
                  <p>{draft.office}</p>
                </div>
                <span className="category-pill">{draft.deliveryLabel}</span>
              </div>

              <p className="benefit-copy">{draft.summary}</p>
              <p className="office-copy">{draft.eligibility}</p>

              <div className="draft-sections">
                {draft.sections.map((section) => (
                  <section key={`${draft.id}-${section.title}`} className="draft-section">
                    <strong>{section.title}</strong>
                    <dl className="draft-definition-list">
                      {section.fields.map((field) => (
                        <div key={`${draft.id}-${field.label}`}>
                          <dt>{field.label}</dt>
                          <dd>{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>

              <div className="apply-submission-info">
                {sub.phone && (
                  <p className="office-copy">
                    <strong>{isSpanish ? "Tel: " : "Call: "}</strong>
                    <a href={`tel:${sub.phone}`}>{sub.phone}</a>
                    {sub.hoursEn && !isSpanish && ` · ${sub.hoursEn}`}
                    {sub.hoursEs && isSpanish && ` · ${sub.hoursEs}`}
                  </p>
                )}
                {(sub.inPersonEn || sub.inPersonEs) && (
                  <p className="office-copy">
                    <strong>{isSpanish ? "En persona: " : "In person: "}</strong>
                    {isSpanish ? sub.inPersonEs : sub.inPersonEn}
                  </p>
                )}
                {(sub.mailEn || sub.mailEs) && (
                  <p className="office-copy">
                    <strong>{isSpanish ? "Por correo: " : "By mail: "}</strong>
                    {isSpanish ? sub.mailEs : sub.mailEn}
                  </p>
                )}
              </div>

              <div className="apply-card-actions">
                {draft.supportsOnline ? (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleOnline(draft.program.applyUrl)}
                  >
                    {isSpanish ? "Abrir portal oficial" : "Open official portal"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleOnline(draft.program.applyUrl)}
                  >
                    {isSpanish ? "Ver mas informacion" : "More information"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
