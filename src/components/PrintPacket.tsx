import { buildApplicationDrafts } from "../lib/applicationDrafts";
import { buildPacketTemplates } from "../lib/packetTemplates";
import { TexasBenefitsForms } from "./TexasBenefitsForms";
import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";

interface PrintPacketProps {
  intake: IntakeFormValue;
  matches: MatchResult[];
  printTarget: string | "all";
}

export function PrintPacket({ intake, matches, printTarget }: PrintPacketProps) {
  const selectedMatches =
    printTarget === "all"
      ? matches.slice(0, 4)
      : matches.filter(({ program }) => program.id === printTarget).slice(0, 1);
  const applicantName = `${intake.firstName} ${intake.lastName}`.trim();
  const packetTemplates = buildPacketTemplates(intake, selectedMatches, intake.language);
  const applicationDrafts = buildApplicationDrafts(intake, selectedMatches);
  const labels = getLabels(intake.language);

  return (
    <section className="panel print-panel">
      <div className="section-heading">
        <span className="eyebrow">{labels.packetEyebrow}</span>
        <h2>{labels.packetTitle}</h2>
        <p>{labels.packetDescription}</p>
      </div>

      <div className="print-sheet" id="print-sheet">
        <header className="print-header">
          <div>
            <h3>{labels.prefilledTitle}</h3>
            <p>
              {labels.preparedFor} {applicantName || labels.applicant}
            </p>
            <p className="print-helper">{labels.printHelper}</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => window.print()}>
            {labels.printButton}
          </button>
        </header>

        <div className="packet-grid">
          <section>
            <h4>{labels.summaryTitle}</h4>
            <dl>
              <div>
                <dt>{labels.location}</dt>
                <dd>
                  {intake.city || labels.unknownCity}, {regionLabel(intake.region, intake.language)}
                </dd>
              </div>
              <div>
                <dt>{labels.address}</dt>
                <dd>{intake.address || labels.leaveBlank}</dd>
              </div>
              <div>
                <dt>{labels.phone}</dt>
                <dd>{intake.phone || labels.leaveBlank}</dd>
              </div>
              <div>
                <dt>{labels.sensitiveFields}</dt>
                <dd>{intake.skipSensitiveInfo ? labels.skipped : labels.addLater}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h4>{labels.likelyPrograms}</h4>
            <ul className="packet-program-list">
              {selectedMatches.map(({ program }) => (
                <li key={program.id}>
                  <strong>{intake.language === "es" ? program.nameEs : program.name}</strong>
                  <span>{intake.language === "es" ? program.officeLabelEs : program.officeLabel}</span>
                  <span>{program.applyUrl}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="packet-checklist">
          <h4>{labels.draftTitle}</h4>
          <div className="packet-template-list">
            {applicationDrafts.map((draft) => (
              <section key={draft.id} className="packet-template">
                <header className="packet-template-header">
                  <div>
                    <h5>{draft.title}</h5>
                    <p>{draft.office}</p>
                  </div>
                  <span className="packet-mode-pill">{draft.deliveryLabel}</span>
                </header>
                <p className="packet-template-intro">{draft.summary}</p>
                <p className="packet-routing-note">{draft.actionHint}</p>

                <div className="packet-detail-list">
                  {draft.sections.map((section) => (
                    <article key={`${draft.id}-${section.title}`} className="packet-detail-card">
                      <div className="packet-detail-header">
                        <div>
                          <h5>{section.title}</h5>
                          <p>{draft.eligibility}</p>
                        </div>
                      </div>

                      <dl className="draft-definition-list">
                        {section.fields.map((field) => (
                          <div key={`${draft.id}-${field.label}`}>
                            <dt>{field.label}</dt>
                            <dd>{field.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <TexasBenefitsForms intake={intake} matches={selectedMatches} />

        <section className="packet-checklist">
          <h4>{labels.templatesTitle}</h4>
          <div className="packet-template-list">
            {packetTemplates.map((template) => (
              <section key={template.id} className="packet-template">
                <header className="packet-template-header">
                  <div>
                    <h5>{template.title}</h5>
                    <p>{template.subtitle}</p>
                  </div>
                </header>
                <p className="packet-template-intro">{template.intro}</p>
                <p className="packet-routing-note">{template.routingNote}</p>

                <div className="packet-detail-list">
                  {template.programs.map(
                    ({ program, reasons, missingFields, documentsNeeded, nextSteps }) => (
                      <article key={program.id} className="packet-detail-card">
                        <div className="packet-detail-header">
                          <div>
                            <h5>{intake.language === "es" ? program.nameEs : program.name}</h5>
                            <p>{intake.language === "es" ? program.officeLabelEs : program.officeLabel}</p>
                          </div>
                          <span>{program.submissionMode}</span>
                        </div>

                        <div className="packet-columns">
                          <div>
                            <strong>{labels.whyMatch}</strong>
                            <ul>
                              {reasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <strong>{labels.documentsNeeded}</strong>
                            <ul>
                              {documentsNeeded.map((document) => (
                                <li key={document}>{document}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="packet-columns">
                          <div>
                            <strong>{labels.missingFields}</strong>
                            <ul>
                              {missingFields.length > 0 ? (
                                missingFields.map((field) => <li key={field}>{field}</li>)
                              ) : (
                                <li>{labels.noMissingFields}</li>
                              )}
                            </ul>
                          </div>

                          <div>
                            <strong>{labels.nextSteps}</strong>
                            <ul>
                              {nextSteps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function regionLabel(region: IntakeFormValue["region"], language: IntakeFormValue["language"]) {
  const labels = {
    texas: { en: "Texas", es: "Texas" },
    "new-mexico": { en: "New Mexico", es: "Nuevo Mexico" },
    mexico: { en: "Mexico support", es: "Apoyo de Mexico" },
  };

  return labels[region][language];
}

function getLabels(language: IntakeFormValue["language"]) {
  if (language === "es") {
    return {
      packetEyebrow: "Paquete imprimible",
      packetTitle: "Solicitudes listas para imprimir o guardar como PDF",
      packetDescription:
        "Usa este paquete para revisar las respuestas, imprimir formularios base y continuar con cada beneficio por la ruta correcta.",
      prefilledTitle: "Paquete prellenado de Navigator",
      preparedFor: "Preparado para",
      applicant: "Solicitante",
      printButton: "Imprimir o guardar PDF",
      printHelper: "Tu navegador puede guardar este paquete como PDF desde la ventana de impresion.",
      summaryTitle: "Resumen del solicitante",
      location: "Ubicacion",
      unknownCity: "Ciudad desconocida",
      address: "Direccion",
      leaveBlank: "Dejar en blanco para llenado posterior",
      phone: "Telefono",
      sensitiveFields: "Campos sensibles",
      skipped: "Omitidos por privacidad",
      addLater: "Se pueden agregar despues",
      likelyPrograms: "Beneficios seleccionados",
      draftTitle: "Borradores de solicitud",
      templatesTitle: "Rutas y documentos por programa",
      whyMatch: "Por que coincide",
      documentsNeeded: "Documentos necesarios",
      missingFields: "Campos faltantes para completar despues",
      noMissingFields: "No faltan campos importantes del intake basico.",
      nextSteps: "Siguientes pasos",
    };
  }

  return {
    packetEyebrow: "Printable packet",
    packetTitle: "Applications ready to print or save as PDF",
    packetDescription:
      "Use this packet to review the answers, print base forms, and continue each benefit through the correct route.",
    prefilledTitle: "Navigator prefilled packet",
    preparedFor: "Prepared for",
    applicant: "Applicant",
    printButton: "Print or save PDF",
    printHelper: "Your browser can save this packet as a PDF from the print dialog.",
    summaryTitle: "Applicant summary",
    location: "Location",
    unknownCity: "Unknown city",
    address: "Address",
    leaveBlank: "Leave blank for later completion",
    phone: "Phone",
    sensitiveFields: "Sensitive fields",
    skipped: "Skipped for privacy",
    addLater: "May be added later",
    likelyPrograms: "Selected benefits",
    draftTitle: "Application drafts",
    templatesTitle: "Program routes and required documents",
    whyMatch: "Why this match",
    documentsNeeded: "Needed documents",
    missingFields: "Missing fields to fill later",
    noMissingFields: "No major fields missing from the basic intake.",
    nextSteps: "Next steps",
  };
}
