import { useMemo, useState } from "react";
import { buildApplicationDrafts } from "../lib/applicationDrafts";
import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";
import { hasTexasBenefitsPaperForm } from "./TexasBenefitsForms";

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
  const showTexasPaperForms = hasTexasBenefitsPaperForm(matches);

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
        <span className="eyebrow">{intake.language === "es" ? "Aplicar ahora" : "Apply now"}</span>
        <h2>
          {intake.language === "es"
            ? "Borradores de solicitud por beneficio"
            : "Benefit-by-benefit application drafts"}
        </h2>
        <p>
          {intake.language === "es"
            ? "Estos borradores usan la informacion del intake, explican por que cada beneficio encaja y te dejan elegir entre descargar el PDF llenado o continuar por la ruta oficial."
            : "These drafts use the intake information, explain why each benefit fits, and let you choose between downloading the filled PDF or continuing through the official route."}
        </p>
        {showTexasPaperForms ? (
          <p>
            {intake.language === "es"
              ? "Para SNAP, TANF, Medicaid y CHIP de Texas, el paquete ahora incluye el formulario H1010 prellenado en lugar de solo mandar al enlace."
              : "For Texas SNAP, TANF, Medicaid, and CHIP, the packet now includes a filled H1010 paper form instead of only sending the user to the link."}
          </p>
        ) : null}
      </div>

      <div className="delivery-toggle" role="tablist" aria-label="Delivery mode">
        <button
          type="button"
          className={deliveryMode === "online" ? "reply-chip active" : "reply-chip"}
          onClick={() => setDeliveryMode("online")}
        >
          {intake.language === "es" ? "Ruta oficial" : "Official route"}
        </button>
        <button
          type="button"
          className={deliveryMode === "print" ? "reply-chip active" : "reply-chip"}
          onClick={() => handlePrint("all")}
        >
          {intake.language === "es" ? "PDF llenado" : "Filled PDF"}
        </button>
      </div>

      <div className="apply-stack">
        {applicationDrafts.map((draft) => (
          <article key={draft.id} className="apply-card">
            <div className="apply-card-header">
              <div>
                <h3>{draft.title}</h3>
                <p>{draft.office}</p>
              </div>
              <span className="category-pill">{draft.deliveryLabel}</span>
            </div>

            <p className="benefit-copy">{draft.summary}</p>
            <p className="office-copy">
              {intake.language === "es" ? "Regla base: " : "Basic rule: "}
              {draft.eligibility}
            </p>
            <p className="office-copy">{draft.actionHint}</p>

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

            <div className="apply-card-actions">
              {draft.supportsOnline ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleOnline(draft.id, draft.program.applyUrl)}
                >
                  {intake.language === "es"
                    ? "Abrir portal oficial cuando este listo"
                    : "Open official portal when ready"}
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handlePrint(draft.id)}
                >
                  {intake.language === "es" ? "Preparar para imprimir" : "Prepare to print"}
                </button>
              )}

              {draft.supportsPrinting ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handlePrint(draft.id)}
                >
                  {deliveryMode === "print"
                    ? intake.language === "es"
                      ? "Ver paquete imprimible"
                      : "View printable packet"
                    : intake.language === "es"
                      ? "Guardar como PDF"
                      : "Save as PDF"}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
