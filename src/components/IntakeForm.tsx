import { ChangeEvent } from "react";
import { IntakeForm as IntakeFormValue } from "../lib/matching";

interface IntakeFormProps {
  value: IntakeFormValue;
  onChange: (
    key: keyof IntakeFormValue,
    nextValue: IntakeFormValue[keyof IntakeFormValue],
  ) => void;
  onSubmit: () => void;
}

type BooleanFieldKey =
  | "hasDisability"
  | "pregnantOrPostpartum"
  | "childrenUnder5"
  | "childrenUnder19"
  | "needsHousingHelp"
  | "needsUtilityHelp"
  | "skipSensitiveInfo";

const booleanFields: Array<{
  key: BooleanFieldKey;
  label: string;
  description: string;
}> = [
  {
    key: "hasDisability",
    label: "Disability or chronic condition",
    description: "Needed for SSI, SSDI, STAR+PLUS, Medicare disability, and VR.",
  },
  {
    key: "pregnantOrPostpartum",
    label: "Pregnant or postpartum",
    description: "Needed for WIC and maternal health support.",
  },
  {
    key: "childrenUnder5",
    label: "Child under 5 in home",
    description: "Needed for WIC and Head Start.",
  },
  {
    key: "childrenUnder19",
    label: "Child under 19 in home",
    description: "Needed for CHIP and TANF.",
  },
  {
    key: "needsHousingHelp",
    label: "Needs rent or housing help",
    description: "Used for Section 8 and local housing referrals.",
  },
  {
    key: "needsUtilityHelp",
    label: "Needs utility bill help",
    description: "Used for LIHEAP and emergency relief referrals.",
  },
  {
    key: "skipSensitiveInfo",
    label: "Skip Social Security and sensitive questions",
    description: "Forms stay printable, with private fields left blank.",
  },
];

export function IntakeForm({ value, onChange, onSubmit }: IntakeFormProps) {
  function handleInput(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value: nextValue } = event.target;
    onChange(name as keyof IntakeFormValue, nextValue as IntakeFormValue[keyof IntakeFormValue]);
  }

  return (
    <section className="panel panel-large">
      <div className="section-heading">
        <span className="eyebrow">10-minute intake</span>
        <h2>Fast eligibility check</h2>
        <p>
          Ask only the fields that change eligibility. Sensitive identity questions can stay
          blank and be completed on paper later.
        </p>
      </div>

      <div className="form-grid">
        <label>
          Preferred language
          <select
            name="language"
            value={value.language}
            onChange={handleInput}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </label>

        <label>
          First name
          <input name="firstName" value={value.firstName} onChange={handleInput} />
        </label>

        <label>
          Last name
          <input name="lastName" value={value.lastName} onChange={handleInput} />
        </label>

        <label>
          City
          <input name="city" value={value.city} onChange={handleInput} />
        </label>

        <label>
          Region
          <select name="region" value={value.region} onChange={handleInput}>
            <option value="texas">Texas</option>
            <option value="new-mexico">New Mexico</option>
            <option value="mexico">Mexico border resident</option>
          </select>
        </label>

        <label>
          Age group
          <select name="ageBand" value={value.ageBand} onChange={handleInput}>
            <option value="under-18">Under 18</option>
            <option value="18-64">18 to 64</option>
            <option value="65-plus">65+</option>
          </select>
        </label>

        <label>
          Household size
          <input name="householdSize" value={value.householdSize} onChange={handleInput} />
        </label>

        <label>
          Monthly income
          <select
            name="monthlyIncomeBand"
            value={value.monthlyIncomeBand}
            onChange={handleInput}
          >
            <option value="under-1000">Under $1,000</option>
            <option value="1000-2000">$1,000 to $2,000</option>
            <option value="2000-3500">$2,000 to $3,500</option>
            <option value="3500-plus">$3,500+</option>
          </select>
        </label>

        <label className="full-width">
          Address
          <input name="address" value={value.address} onChange={handleInput} />
        </label>

        <label>
          Phone
          <input name="phone" value={value.phone} onChange={handleInput} />
        </label>

        <label className="full-width">
          Notes
          <textarea
            name="notes"
            rows={3}
            value={value.notes}
            onChange={handleInput}
            placeholder="Interpreter needs, veteran status, immigration concerns, or office visit preferences."
          />
        </label>
      </div>

      <div className="toggle-grid">
        {booleanFields.map((field) => (
          <button
            key={field.key}
            type="button"
            className={value[field.key] ? "toggle-card active" : "toggle-card"}
            onClick={() => onChange(field.key, !value[field.key])}
          >
            <strong>{field.label}</strong>
            <span>{field.description}</span>
          </button>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="primary-button" onClick={onSubmit}>
          Find matching benefits
        </button>
      </div>
    </section>
  );
}
