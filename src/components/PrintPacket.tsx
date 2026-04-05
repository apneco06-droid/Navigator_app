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

                        {(missingFields.length > 0 || nextSteps.length > 0) && (
                          <div className="packet-columns">
                            {missingFields.length > 0 && (
                              <div>
                                <strong>{labels.missingFields}</strong>
                                <ul>
                                  {missingFields.map((field) => (
                                    <li key={field}>{field}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {nextSteps.length > 0 && (
                              <div>
                                <strong>{labels.nextSteps}</strong>
                                <ul>
                                  {nextSteps.map((step) => (
                                    <li key={step}>{step}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
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
      packetTitle: "Aplicaciones listas para imprimir",
      packetDescription: "Revisa, imprime o guarda como PDF para cada beneficio.",
      prefilledTitle: "Paquete prellenado",
      preparedFor: "Para",
      applicant: "Solicitante",
      printButton: "Imprimir / PDF",
      summaryTitle: "Resumen",
      location: "Ubicacion",
      unknownCity: "Ciudad desconocida",
      address: "Direccion",
      leaveBlank: "Pendiente",
      phone: "Telefono",
      sensitiveFields: "Datos sensibles",
      skipped: "Omitidos",
      addLater: "Por agregar",
      likelyPrograms: "Beneficios seleccionados",
      templatesTitle: "Por que coincide y que llevar",
      whyMatch: "Por que coincide",
      documentsNeeded: "Que llevar",
      missingFields: "Por completar",
      nextSteps: "Siguientes pasos",
    };
  }

  return {
    packetEyebrow: "Printable packet",
    packetTitle: "Applications ready to print",
    packetDescription: "Review, print, or save as PDF for each benefit.",
    prefilledTitle: "Prefilled packet",
    preparedFor: "For",
    applicant: "Applicant",
    printButton: "Print / PDF",
    summaryTitle: "Summary",
    location: "Location",
    unknownCity: "Unknown city",
    address: "Address",
    leaveBlank: "Pending",
    phone: "Phone",
    sensitiveFields: "Sensitive fields",
    skipped: "Skipped",
    addLater: "To add later",
    likelyPrograms: "Selected benefits",
    templatesTitle: "Why it fits & what to bring",
    whyMatch: "Why it fits",
    documentsNeeded: "Bring",
    missingFields: "To complete",
    nextSteps: "Next steps",
  };
}
