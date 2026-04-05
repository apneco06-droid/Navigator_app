import { MatchResult, Language, translateCategory } from "../lib/matching";

interface ProgramMatchesProps {
  matches: MatchResult[];
  language: Language;
}

export function ProgramMatches({ matches, language }: ProgramMatchesProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">{language === "es" ? "Mejores opciones" : "Best matches"}</span>
        <h2>{language === "es" ? "Beneficios probables" : "Likely benefits"}</h2>
        <p>
          {language === "es"
            ? "Estos resultados explican por que cada beneficio coincide y que sigue despues."
            : "These results explain why each benefit fits and what happens next."}
        </p>
      </div>

      <div className="card-stack">
        {matches.map(({ program, reasons, score, documentsNeeded, nextSteps }) => (
          <article key={program.id} className="benefit-card">
            <div className="benefit-card-header">
              <div>
                <p className="category-pill">{translateCategory(program.category, language)}</p>
                <h3>{language === "es" ? program.nameEs : program.name}</h3>
              </div>
              <span className="score-pill">
                {Math.round(score * 100)}%
                {language === "es" ? " ajuste" : " fit"}
              </span>
            </div>

            <p className="benefit-copy">
              {language === "es" ? program.descriptionEs : program.description}
            </p>
            <p className="office-copy">
              {language === "es" ? "Elegibilidad base: " : "Basic eligibility: "}
              {language === "es" ? program.eligibilityEs : program.eligibility}
            </p>
            <p className="office-copy">
              {language === "es" ? "Siguiente oficina: " : "Best next stop: "}
              {language === "es" ? program.officeLabelEs : program.officeLabel}
            </p>

            <div className="benefit-detail-grid">
              <div>
                <strong>{language === "es" ? "Por que coincide" : "Why it matches"}</strong>
                <ul className="reason-list">
                  {reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>{language === "es" ? "Documentos" : "Documents"}</strong>
                <ul className="reason-list">
                  {documentsNeeded.map((document) => (
                    <li key={document}>{document}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="benefit-detail-grid">
              <div>
                <strong>{language === "es" ? "Proximo paso" : "Next step"}</strong>
                <ul className="reason-list">
                  {nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
              <div className="benefit-actions">
                <a href={program.applyUrl} target="_blank" rel="noreferrer">
                  {language === "es"
                    ? program.submissionMode === "office"
                      ? "Ver detalles de oficina"
                      : "Abrir sitio oficial"
                    : program.submissionMode === "office"
                      ? "Office details"
                      : "Open official site"}
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
