import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";

interface TexasBenefitsFormsProps {
  intake: IntakeFormValue;
  matches: MatchResult[];
}

const texasBenefitsProgramIds = new Set(["snap", "medicaid", "chip", "tanf"]);

export function hasTexasBenefitsPaperForm(matches: MatchResult[]) {
  return matches.some(({ program }) => texasBenefitsProgramIds.has(program.id));
}

export function TexasBenefitsForms({ intake, matches }: TexasBenefitsFormsProps) {
  const texasMatches = matches.filter(({ program }) => texasBenefitsProgramIds.has(program.id));
  if (texasMatches.length === 0) {
    return null;
  }

  const benefitNames = texasMatches.map(({ program }) =>
    intake.language === "es" ? program.nameEs : program.name,
  );
  const needsMedicalAddendum = texasMatches.some(({ program }) =>
    ["medicaid", "chip"].includes(program.id),
  );

  return (
    <section className="packet-checklist">
      <h4>
        {intake.language === "es"
          ? "Formulario H1010 prellenado de Texas"
          : "Prefilled Texas H1010 application"}
      </h4>

      <div className="texas-form-sheet">
        <header className="texas-form-header">
          <div>
            <p className="texas-form-kicker">
              {intake.language === "es"
                ? "Formulario oficial de referencia"
                : "Official reference form"}
            </p>
            <h5>
              {intake.language === "es"
                ? "Texas Works Application for Assistance - Your Texas Benefits (H1010)"
                : "Texas Works Application for Assistance - Your Texas Benefits (H1010)"}
            </h5>
            <p>
              {intake.language === "es"
                ? "Beneficios marcados para esta solicitud:"
                : "Benefits selected for this application:"}{" "}
              {benefitNames.join(", ")}
            </p>
          </div>
          <span className="packet-mode-pill">H1010</span>
        </header>

        <div className="texas-form-grid">
          <section className="texas-form-card">
            <strong>{intake.language === "es" ? "Solicitante principal" : "Main applicant"}</strong>
            <dl className="draft-definition-list">
              <div>
                <dt>{intake.language === "es" ? "Nombre" : "First name"}</dt>
                <dd>{valueOrBlank(intake.firstName, intake.language)}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Apellido" : "Last name"}</dt>
                <dd>{valueOrBlank(intake.lastName, intake.language)}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Direccion" : "Address"}</dt>
                <dd>{valueOrBlank(intake.address, intake.language)}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Ciudad / Region" : "City / region"}</dt>
                <dd>{`${valueOrBlank(intake.city, intake.language)} / ${regionLabel(intake.region, intake.language)}`}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Telefono" : "Phone number"}</dt>
                <dd>{valueOrBlank(intake.phone, intake.language)}</dd>
              </div>
            </dl>
          </section>

          <section className="texas-form-card">
            <strong>{intake.language === "es" ? "Composicion del hogar" : "Household profile"}</strong>
            <dl className="draft-definition-list">
              <div>
                <dt>{intake.language === "es" ? "Tamano del hogar" : "Household size"}</dt>
                <dd>{valueOrBlank(intake.householdSize, intake.language)}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Ingreso mensual" : "Monthly income"}</dt>
                <dd>{incomeLabel(intake.monthlyIncomeBand, intake.language)}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Edad del solicitante" : "Applicant age band"}</dt>
                <dd>{ageLabel(intake.ageBand, intake.language)}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Ninos menores de 19" : "Children under 19"}</dt>
                <dd>{booleanLabel(intake.childrenUnder19, intake.language)}</dd>
              </div>
              <div>
                <dt>{intake.language === "es" ? "Ninos menores de 5" : "Children under 5"}</dt>
                <dd>{booleanLabel(intake.childrenUnder5, intake.language)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="texas-form-card">
          <strong>{intake.language === "es" ? "Beneficios solicitados" : "Benefits requested"}</strong>
          <div className="texas-checkbox-list">
            <label className={isSelected(texasMatches, "snap") ? "texas-check checked" : "texas-check"}>
              <span>{isSelected(texasMatches, "snap") ? "☑" : "☐"}</span>
              <span>SNAP food benefits</span>
            </label>
            <label className={isSelected(texasMatches, "tanf") ? "texas-check checked" : "texas-check"}>
              <span>{isSelected(texasMatches, "tanf") ? "☑" : "☐"}</span>
              <span>TANF cash help</span>
            </label>
            <label className={isSelected(texasMatches, "medicaid") ? "texas-check checked" : "texas-check"}>
              <span>{isSelected(texasMatches, "medicaid") ? "☑" : "☐"}</span>
              <span>Medicaid</span>
            </label>
            <label className={isSelected(texasMatches, "chip") ? "texas-check checked" : "texas-check"}>
              <span>{isSelected(texasMatches, "chip") ? "☑" : "☐"}</span>
              <span>CHIP</span>
            </label>
          </div>
        </section>

        <section className="texas-form-card">
          <strong>{intake.language === "es" ? "Notas para el trabajador del caso" : "Caseworker notes"}</strong>
          <dl className="draft-definition-list">
            <div>
              <dt>{intake.language === "es" ? "Omitir datos sensibles" : "Sensitive fields left blank"}</dt>
              <dd>{booleanLabel(intake.skipSensitiveInfo, intake.language)}</dd>
            </div>
            <div>
              <dt>{intake.language === "es" ? "Discapacidad o condicion cronica" : "Disability or chronic condition"}</dt>
              <dd>{booleanLabel(intake.hasDisability, intake.language)}</dd>
            </div>
            <div>
              <dt>{intake.language === "es" ? "Embarazo o posparto" : "Pregnant or postpartum"}</dt>
              <dd>{booleanLabel(intake.pregnantOrPostpartum, intake.language)}</dd>
            </div>
            <div>
              <dt>{intake.language === "es" ? "Notas adicionales" : "Additional notes"}</dt>
              <dd>{valueOrBlank(intake.notes, intake.language)}</dd>
            </div>
          </dl>
        </section>

        {needsMedicalAddendum ? (
          <section className="texas-form-card">
            <div className="texas-form-subheader">
              <div>
                <strong>
                  {intake.language === "es"
                    ? "Addendum medico H1010-MR"
                    : "H1010-MR medical addendum"}
                </strong>
                <p>
                  {intake.language === "es"
                    ? "Texas usa este addendum cuando la solicitud incluye Medicaid o CHIP."
                    : "Texas uses this addendum when the application includes Medicaid or CHIP."}
                </p>
              </div>
              <span className="packet-mode-pill">H1010-MR</span>
            </div>

            <div className="texas-form-grid">
              <dl className="draft-definition-list">
                <div>
                  <dt>{intake.language === "es" ? "Persona 1" : "Person 1"}</dt>
                  <dd>{`${valueOrBlank(intake.firstName, intake.language)} ${valueOrBlank(intake.lastName, intake.language)}`}</dd>
                </div>
                <div>
                  <dt>{intake.language === "es" ? "Planea declarar impuestos federales" : "Plans to file federal taxes"}</dt>
                  <dd>{blankLater(intake.language)}</dd>
                </div>
                <div>
                  <dt>{intake.language === "es" ? "Reclamara dependientes" : "Will claim dependents"}</dt>
                  <dd>{intake.childrenUnder19 || intake.childrenUnder5 ? booleanLabel(true, intake.language) : blankLater(intake.language)}</dd>
                </div>
              </dl>

              <dl className="draft-definition-list">
                <div>
                  <dt>{intake.language === "es" ? "Relacion con menores en el hogar" : "Relationship to children in household"}</dt>
                  <dd>{intake.childrenUnder19 || intake.childrenUnder5 ? providedOrFollowUp(intake.language) : blankLater(intake.language)}</dd>
                </div>
                <div>
                  <dt>{intake.language === "es" ? "Firma requerida" : "Signature required"}</dt>
                  <dd>
                    {intake.language === "es"
                      ? "Pendiente para impresion o firma presencial."
                      : "Pending for print signing or in-person signature."}
                  </dd>
                </div>
                <div>
                  <dt>{intake.language === "es" ? "Fecha" : "Date"}</dt>
                  <dd>{new Date().toLocaleDateString(intake.language === "es" ? "es-US" : "en-US")}</dd>
                </div>
              </dl>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function isSelected(matches: MatchResult[], programId: string) {
  return matches.some(({ program }) => program.id === programId);
}

function valueOrBlank(value: string, language: IntakeFormValue["language"]) {
  return value.trim() || blankLater(language);
}

function blankLater(language: IntakeFormValue["language"]) {
  return language === "es" ? "Completar despues" : "Complete later";
}

function providedOrFollowUp(language: IntakeFormValue["language"]) {
  return language === "es" ? "Requiere confirmacion adicional" : "Needs follow-up confirmation";
}

function booleanLabel(value: boolean, language: IntakeFormValue["language"]) {
  return value ? (language === "es" ? "Si" : "Yes") : language === "es" ? "No" : "No";
}

function ageLabel(ageBand: IntakeFormValue["ageBand"], language: IntakeFormValue["language"]) {
  const labels = {
    "under-18": { en: "Under 18", es: "Menor de 18" },
    "18-64": { en: "18 to 64", es: "18 a 64" },
    "65-plus": { en: "65 and older", es: "65 o mas" },
  };

  return labels[ageBand][language];
}

function incomeLabel(
  incomeBand: IntakeFormValue["monthlyIncomeBand"],
  language: IntakeFormValue["language"],
) {
  const labels = {
    "under-1000": { en: "Under $1,000", es: "Menos de $1,000" },
    "1000-2000": { en: "$1,000 to $2,000", es: "$1,000 a $2,000" },
    "2000-3500": { en: "$2,000 to $3,500", es: "$2,000 a $3,500" },
    "3500-plus": { en: "$3,500 and up", es: "$3,500 o mas" },
  };

  return labels[incomeBand][language];
}

function regionLabel(region: IntakeFormValue["region"], language: IntakeFormValue["language"]) {
  const labels = {
    texas: { en: "Texas", es: "Texas" },
    "new-mexico": { en: "New Mexico", es: "Nuevo Mexico" },
    mexico: { en: "Mexico support", es: "Apoyo de Mexico" },
  };

  return labels[region][language];
}
