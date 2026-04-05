import { ChangeEvent } from "react";
import { IntakeForm as IntakeFormValue } from "../lib/matching";

interface OfficialFormDetailsProps {
  intake: IntakeFormValue;
  onChange: <Key extends keyof IntakeFormValue>(
    key: Key,
    value: IntakeFormValue[Key],
  ) => void;
}

export function OfficialFormDetails({ intake, onChange }: OfficialFormDetailsProps) {
  const isSpanish = intake.language === "es";

  function handleInput(
    key: keyof IntakeFormValue,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    onChange(key, event.target.value as IntakeFormValue[keyof IntakeFormValue]);
  }

  function handleBoolean(key: keyof IntakeFormValue, value: boolean) {
    onChange(key, value as IntakeFormValue[keyof IntakeFormValue]);
  }

  return (
    <section className="panel mobile-panel">
      <div className="section-heading">
        <span className="eyebrow">{isSpanish ? "Datos oficiales" : "Official form details"}</span>
        <h2>{isSpanish ? "Datos para llenar PDFs reales" : "Details to fill real PDFs"}</h2>
        <p>
          {isSpanish
            ? "Completa estos campos para que la app descargue formularios oficiales ya llenados, no solo resúmenes."
            : "Complete these fields so the app can download filled official forms, not just summaries."}
        </p>
      </div>

      <div className="official-form-grid">
        <label>
          <span>{isSpanish ? "Segundo nombre" : "Middle name"}</span>
          <input value={intake.middleName} onChange={(event) => handleInput("middleName", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Fecha de nacimiento" : "Date of birth"}</span>
          <input
            value={intake.dateOfBirth}
            onChange={(event) => handleInput("dateOfBirth", event)}
            placeholder="MM/DD/YYYY"
          />
        </label>
        <label>
          <span>{isSpanish ? "Numero de Seguro Social" : "Social Security number"}</span>
          <input
            value={intake.socialSecurityNumber}
            onChange={(event) => handleInput("socialSecurityNumber", event)}
            placeholder="000-00-0000"
          />
        </label>
        <label>
          <span>{isSpanish ? "Codigo postal" : "ZIP code"}</span>
          <input value={intake.zipCode} onChange={(event) => handleInput("zipCode", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Condado" : "County"}</span>
          <input value={intake.county} onChange={(event) => handleInput("county", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Correo electronico" : "Email"}</span>
          <input value={intake.email} onChange={(event) => handleInput("email", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Telefono de casa" : "Home phone"}</span>
          <input value={intake.phone} onChange={(event) => handleInput("phone", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Telefono celular" : "Cell phone"}</span>
          <input value={intake.cellPhone} onChange={(event) => handleInput("cellPhone", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Nombre del conyuge" : "Spouse name"}</span>
          <input value={intake.spouseName} onChange={(event) => handleInput("spouseName", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Idioma para entrevista" : "Interview language"}</span>
          <input
            value={intake.interviewLanguage}
            onChange={(event) => handleInput("interviewLanguage", event)}
            placeholder={isSpanish ? "Espanol" : "English"}
          />
        </label>
        <label>
          <span>{isSpanish ? "Idioma del interprete" : "Interpreter language"}</span>
          <input
            value={intake.interpreterLanguage}
            onChange={(event) => handleInput("interpreterLanguage", event)}
            placeholder={isSpanish ? "Espanol" : "Spanish"}
          />
        </label>
        <label>
          <span>{isSpanish ? "Metodo de contacto preferido" : "Preferred contact method"}</span>
          <select
            value={intake.preferredContactMethod}
            onChange={(event) => handleInput("preferredContactMethod", event)}
          >
            <option value="">{isSpanish ? "Seleccionar" : "Select"}</option>
            <option value="phone">{isSpanish ? "Telefono" : "Phone"}</option>
            <option value="text">{isSpanish ? "Texto" : "Text"}</option>
            <option value="email">{isSpanish ? "Correo" : "Email"}</option>
          </select>
        </label>
      </div>

      <div className="official-radio-grid">
        <fieldset>
          <legend>{isSpanish ? "Piensa declarar impuestos el proximo ano" : "Plans to file taxes next year"}</legend>
          <div className="inline-choice-row">
            <button
              type="button"
              className={intake.plansToFileTaxes === "yes" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("plansToFileTaxes", "yes")}
            >
              {isSpanish ? "Si" : "Yes"}
            </button>
            <button
              type="button"
              className={intake.plansToFileTaxes === "no" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("plansToFileTaxes", "no")}
            >
              {isSpanish ? "No" : "No"}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{isSpanish ? "Declarara junto con conyuge" : "Will file jointly"}</legend>
          <div className="inline-choice-row">
            <button
              type="button"
              className={intake.filesJointly === "yes" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("filesJointly", "yes")}
            >
              {isSpanish ? "Si" : "Yes"}
            </button>
            <button
              type="button"
              className={intake.filesJointly === "no" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("filesJointly", "no")}
            >
              {isSpanish ? "No" : "No"}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{isSpanish ? "Reclamara dependientes" : "Will claim dependents"}</legend>
          <div className="inline-choice-row">
            <button
              type="button"
              className={intake.claimsDependents === "yes" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("claimsDependents", "yes")}
            >
              {isSpanish ? "Si" : "Yes"}
            </button>
            <button
              type="button"
              className={intake.claimsDependents === "no" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("claimsDependents", "no")}
            >
              {isSpanish ? "No" : "No"}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{isSpanish ? "Otra persona lo reclama como dependiente" : "Will be claimed by another filer"}</legend>
          <div className="inline-choice-row">
            <button
              type="button"
              className={intake.claimedAsDependent === "yes" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("claimedAsDependent", "yes")}
            >
              {isSpanish ? "Si" : "Yes"}
            </button>
            <button
              type="button"
              className={intake.claimedAsDependent === "no" ? "reply-chip active" : "reply-chip"}
              onClick={() => onChange("claimedAsDependent", "no")}
            >
              {isSpanish ? "No" : "No"}
            </button>
          </div>
        </fieldset>
      </div>

      <div className="official-form-grid">
        <label className="full-span">
          <span>{isSpanish ? "Nombre(s) de dependientes" : "Dependent names"}</span>
          <textarea
            rows={2}
            value={intake.dependentNames}
            onChange={(event) => handleInput("dependentNames", event)}
          />
        </label>
        <label>
          <span>{isSpanish ? "Nombre del declarante principal" : "Tax filer name"}</span>
          <input value={intake.taxFilerName} onChange={(event) => handleInput("taxFilerName", event)} />
        </label>
        <label>
          <span>{isSpanish ? "Relacion con el declarante" : "Relationship to tax filer"}</span>
          <input
            value={intake.taxRelationship}
            onChange={(event) => handleInput("taxRelationship", event)}
          />
        </label>
        <label className="full-span">
          <span>{isSpanish ? "Ayuda especial para entrevista" : "Special interview help needed"}</span>
          <textarea
            rows={2}
            value={intake.interviewHelpDetails}
            onChange={(event) => handleInput("interviewHelpDetails", event)}
          />
        </label>
      </div>

      <div className="toggle-grid-visible">
        <button
          type="button"
          className={intake.isActiveDuty ? "toggle-card active" : "toggle-card"}
          onClick={() => handleBoolean("isActiveDuty", !intake.isActiveDuty)}
        >
          <strong>{isSpanish ? "Servicio militar activo" : "Active duty military"}</strong>
        </button>
        <button
          type="button"
          className={intake.isVeteran ? "toggle-card active" : "toggle-card"}
          onClick={() => handleBoolean("isVeteran", !intake.isVeteran)}
        >
          <strong>{isSpanish ? "Veterano" : "Veteran"}</strong>
        </button>
        <button
          type="button"
          className={intake.needsInterviewHelp ? "toggle-card active" : "toggle-card"}
          onClick={() => handleBoolean("needsInterviewHelp", !intake.needsInterviewHelp)}
        >
          <strong>{isSpanish ? "Necesita ayuda para entrevista" : "Needs interview help"}</strong>
        </button>
        <button
          type="button"
          className={intake.needsInterpreter ? "toggle-card active" : "toggle-card"}
          onClick={() => handleBoolean("needsInterpreter", !intake.needsInterpreter)}
        >
          <strong>{isSpanish ? "Necesita interprete" : "Needs interpreter"}</strong>
        </button>
      </div>
    </section>
  );
}
