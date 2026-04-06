import { useMemo, useState } from "react";
import { buildApplicationDrafts } from "../lib/applicationDrafts";
import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";
import { getSubmissionInfo } from "../data/submissionInfo";

interface ApplyNowProps {
  intake: IntakeFormValue;
  matches: MatchResult[];
  onPreparePrint: (target: string | "all") => void;
}

type DeliveryMode = "online" | "print";

export function ApplyNow({ intake, matches, onPreparePrint }: ApplyNowProps) {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("online");
  const applicationDrafts = useMemo(
    () => buildApplicationDrafts(intake, matches),
    [intake, matches],
  );
  const isSpanish = intake.language === "es";

  function handleOnline(programId: string, url: string) {
    setDeliveryMode("online");
    window.open(url, "_blank", "noopener,noreferrer");
    onPreparePrint(programId);
  }

  function handlePrint(programId: string | "all") {
    setDeliveryMode("print");
    onPreparePrint(programId);
    document.getElementById("print-sheet")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="panel mobile-panel">
      <div className="section-heading">
        <span className="eyebrow">{isSpanish ? "Aplicar ahora" : "Apply now"}</span>
        <h2>{isSpanish ? "Solicitudes por beneficio" : "Applications by benefit"}</h2>
        <p>
          {isSpanish
            ? "Elige el portal oficial o descarga el PDF prellenado."
            : "Choose the official portal or download a prefilled PDF."}
        </p>
      </div>

      <div className="delivery-toggle" role="tablist" aria-label="Delivery mode">
        <button
          type="button"
          className={deliveryMode === "online" ? "reply-chip active" : "reply-chip"}
          onClick={() => setDeliveryMode("online")}
        >
          {isSpanish ? "Ruta oficial" : "Official portal"}
        </button>
        <button
          type="button"
          className={deliveryMode === "print" ? "reply-chip active" : "reply-chip"}
          onClick={() => handlePrint("all")}
        >
          {isSpanish ? "PDF prellenado" : "Filled PDF"}
        </button>
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
                    onClick={() => handleOnline(draft.id, draft.program.applyUrl)}
                  >
                    {isSpanish ? "Abrir portal oficial" : "Open official portal"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handlePrint(draft.id)}
                  >
                    {isSpanish ? "Preparar para imprimir" : "Prepare to print"}
                  </button>
                )}

                {draft.supportsPrinting ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handlePrint(draft.id)}
                  >
                    {isSpanish ? "Guardar PDF" : "Save as PDF"}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
