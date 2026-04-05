import { ChangeEvent, useCallback, useEffect, useMemo } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { IntakeForm as IntakeFormValue, Language } from "../lib/matching";

interface ConversationGuideProps {
  intake: IntakeFormValue;
  currentStep: number;
  onAnswer: <Key extends keyof IntakeFormValue>(
    key: Key,
    value: IntakeFormValue[Key],
  ) => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  onSpeak: (text: string) => void;
}

type ConversationStep = {
  key: keyof IntakeFormValue;
  type: "choice" | "text" | "textarea";
  title: Record<Language, string>;
  description: Record<Language, string>;
  placeholder?: Record<Language, string>;
  inputMode?: "text" | "tel";
  required?: boolean;
  options?: Array<{
    label: Record<Language, string>;
    value: IntakeFormValue[keyof IntakeFormValue];
    tokens: string[];
  }>;
};

const yesTokens = ["yes", "yeah", "yep", "si", "sí", "claro"];
const noTokens = ["no", "nope"];

const steps: ConversationStep[] = [
  {
    key: "language",
    type: "choice",
    title: {
      en: "Which language should we use?",
      es: "Que idioma prefieres usar?",
    },
    description: {
      en: "Say English or Spanish and the rest of the app will follow that language.",
      es: "Di ingles o espanol y el resto de la app seguira ese idioma.",
    },
    options: [
      {
        label: { en: "English", es: "Ingles" },
        value: "en",
        tokens: ["english", "ingles", "ingles please", "use english"],
      },
      {
        label: { en: "Spanish", es: "Espanol" },
        value: "es",
        tokens: ["spanish", "espanol", "español", "hablo espanol", "use spanish"],
      },
    ],
  },
  {
    key: "firstName",
    type: "text",
    required: true,
    inputMode: "text",
    title: {
      en: "What is the applicant's first name?",
      es: "Cual es el nombre de la persona solicitante?",
    },
    description: {
      en: "We use this to prepare each benefit application draft.",
      es: "Usamos esto para preparar cada borrador de solicitud.",
    },
    placeholder: {
      en: "First name",
      es: "Nombre",
    },
  },
  {
    key: "lastName",
    type: "text",
    required: true,
    inputMode: "text",
    title: {
      en: "What is the applicant's last name?",
      es: "Cual es el apellido de la persona solicitante?",
    },
    description: {
      en: "Last name is needed for printable and online-ready forms.",
      es: "El apellido se necesita para formularios imprimibles y listos para continuar en linea.",
    },
    placeholder: {
      en: "Last name",
      es: "Apellido",
    },
  },
  {
    key: "city",
    type: "text",
    required: true,
    inputMode: "text",
    title: {
      en: "Which city is the applicant in?",
      es: "En que ciudad esta la persona solicitante?",
    },
    description: {
      en: "This helps route the application to the right office.",
      es: "Esto ayuda a dirigir la solicitud a la oficina correcta.",
    },
    placeholder: {
      en: "City",
      es: "Ciudad",
    },
  },
  {
    key: "region",
    type: "choice",
    title: {
      en: "Where should we search for benefits?",
      es: "Donde debemos buscar beneficios?",
    },
    description: {
      en: "Pick the main state or support system for this application.",
      es: "Elige el estado principal o el sistema de apoyo para esta solicitud.",
    },
    options: [
      {
        label: { en: "Texas", es: "Texas" },
        value: "texas",
        tokens: ["texas", "tx"],
      },
      {
        label: { en: "New Mexico", es: "Nuevo Mexico" },
        value: "new-mexico",
        tokens: ["new mexico", "nuevo mexico", "nuevo méxico", "nm"],
      },
      {
        label: { en: "Mexico support", es: "Apoyo de Mexico" },
        value: "mexico",
        tokens: ["mexico", "méxico", "consulado", "consulate"],
      },
    ],
  },
  {
    key: "address",
    type: "text",
    required: true,
    inputMode: "text",
    title: {
      en: "What is the applicant's street address?",
      es: "Cual es la direccion de la persona solicitante?",
    },
    description: {
      en: "A street address makes the printable packet much more usable.",
      es: "La direccion hace que el paquete imprimible sea mucho mas util.",
    },
    placeholder: {
      en: "Street address",
      es: "Direccion",
    },
  },
  {
    key: "phone",
    type: "text",
    required: true,
    inputMode: "tel",
    title: {
      en: "What phone number should go on the applications?",
      es: "Que numero de telefono debe ir en las solicitudes?",
    },
    description: {
      en: "Caseworkers often use this for follow-up.",
      es: "El personal de la oficina suele usar este numero para seguimiento.",
    },
    placeholder: {
      en: "Phone number",
      es: "Numero de telefono",
    },
  },
  {
    key: "householdSize",
    type: "choice",
    title: {
      en: "How many people are in the household?",
      es: "Cuantas personas hay en el hogar?",
    },
    description: {
      en: "An estimate is enough for the first application pass.",
      es: "Una estimacion es suficiente para la primera revision.",
    },
    options: [
      { label: { en: "1", es: "1" }, value: "1", tokens: ["1", "one", "uno"] },
      { label: { en: "2", es: "2" }, value: "2", tokens: ["2", "two", "dos"] },
      { label: { en: "3", es: "3" }, value: "3", tokens: ["3", "three", "tres"] },
      { label: { en: "4", es: "4" }, value: "4", tokens: ["4", "four", "cuatro"] },
      {
        label: { en: "5 or more", es: "5 o mas" },
        value: "5+",
        tokens: ["5", "five", "cinco", "more than five", "mas de cinco"],
      },
    ],
  },
  {
    key: "ageBand",
    type: "choice",
    title: {
      en: "Which age group fits the applicant?",
      es: "Cual grupo de edad aplica?",
    },
    description: {
      en: "This changes senior, disability, and child-related matches.",
      es: "Esto cambia coincidencias para adultos mayores, discapacidad y programas infantiles.",
    },
    options: [
      {
        label: { en: "Under 18", es: "Menor de 18" },
        value: "under-18",
        tokens: ["under 18", "minor", "menor", "child", "kid"],
      },
      {
        label: { en: "18 to 64", es: "18 a 64" },
        value: "18-64",
        tokens: ["18 to 64", "adult", "adulto"],
      },
      {
        label: { en: "65 and older", es: "65 o mas" },
        value: "65-plus",
        tokens: ["65", "senior", "older", "adulto mayor", "mayor"],
      },
    ],
  },
  {
    key: "monthlyIncomeBand",
    type: "choice",
    title: {
      en: "What monthly income range is closest?",
      es: "Que rango de ingreso mensual es el mas cercano?",
    },
    description: {
      en: "An estimate is enough to find likely programs.",
      es: "Una estimacion es suficiente para encontrar programas probables.",
    },
    options: [
      {
        label: { en: "Under $1,000", es: "Menos de $1,000" },
        value: "under-1000",
        tokens: ["under 1000", "less than 1000", "menos de mil"],
      },
      {
        label: { en: "$1,000 to $2,000", es: "$1,000 a $2,000" },
        value: "1000-2000",
        tokens: ["1000", "2000", "between 1000 and 2000", "mil a dos mil"],
      },
      {
        label: { en: "$2,000 to $3,500", es: "$2,000 a $3,500" },
        value: "2000-3500",
        tokens: ["2000", "3500", "two thousand", "dos mil"],
      },
      {
        label: { en: "$3,500+", es: "$3,500+" },
        value: "3500-plus",
        tokens: ["3500", "more than 3500", "mas de 3500"],
      },
    ],
  },
  {
    key: "childrenUnder19",
    type: "choice",
    title: {
      en: "Are there children under 19 in the household?",
      es: "Hay ninos menores de 19 anos en el hogar?",
    },
    description: {
      en: "This affects CHIP, TANF, and some Medicaid paths.",
      es: "Esto afecta CHIP, TANF y algunas rutas de Medicaid.",
    },
    options: [
      { label: { en: "Yes", es: "Si" }, value: true, tokens: yesTokens },
      { label: { en: "No", es: "No" }, value: false, tokens: noTokens },
    ],
  },
  {
    key: "childrenUnder5",
    type: "choice",
    title: {
      en: "Are there children under 5 in the household?",
      es: "Hay ninos menores de 5 anos en el hogar?",
    },
    description: {
      en: "This affects WIC and Head Start.",
      es: "Esto afecta WIC y Head Start.",
    },
    options: [
      { label: { en: "Yes", es: "Si" }, value: true, tokens: yesTokens },
      { label: { en: "No", es: "No" }, value: false, tokens: noTokens },
    ],
  },
  {
    key: "pregnantOrPostpartum",
    type: "choice",
    title: {
      en: "Is the applicant pregnant or postpartum?",
      es: "La persona esta embarazada o en posparto?",
    },
    description: {
      en: "This is mainly used for WIC and maternal health support.",
      es: "Esto se usa principalmente para WIC y apoyo de salud materna.",
    },
    options: [
      { label: { en: "Yes", es: "Si" }, value: true, tokens: yesTokens },
      { label: { en: "No", es: "No" }, value: false, tokens: noTokens },
    ],
  },
  {
    key: "hasDisability",
    type: "choice",
    title: {
      en: "Does the applicant have a disability or chronic condition?",
      es: "La persona tiene discapacidad o una condicion cronica?",
    },
    description: {
      en: "This changes SSI, SSDI, Medicare disability, STAR+PLUS, and VR results.",
      es: "Esto cambia SSI, SSDI, Medicare por discapacidad, STAR+PLUS y VR.",
    },
    options: [
      { label: { en: "Yes", es: "Si" }, value: true, tokens: yesTokens },
      { label: { en: "No", es: "No" }, value: false, tokens: noTokens },
    ],
  },
  {
    key: "needsHousingHelp",
    type: "choice",
    title: {
      en: "Does the household need housing or rent help?",
      es: "El hogar necesita ayuda con vivienda o renta?",
    },
    description: {
      en: "This affects Section 8 and housing referrals.",
      es: "Esto afecta Seccion 8 y referencias de vivienda.",
    },
    options: [
      { label: { en: "Yes", es: "Si" }, value: true, tokens: yesTokens },
      { label: { en: "No", es: "No" }, value: false, tokens: noTokens },
    ],
  },
  {
    key: "needsUtilityHelp",
    type: "choice",
    title: {
      en: "Does the household need help with utility bills?",
      es: "El hogar necesita ayuda con los recibos de servicios?",
    },
    description: {
      en: "This affects LIHEAP and emergency utility support.",
      es: "Esto afecta LIHEAP y apoyo de emergencia para servicios.",
    },
    options: [
      { label: { en: "Yes", es: "Si" }, value: true, tokens: yesTokens },
      { label: { en: "No", es: "No" }, value: false, tokens: noTokens },
    ],
  },
  {
    key: "skipSensitiveInfo",
    type: "choice",
    title: {
      en: "Should we leave Social Security and other sensitive identity fields blank?",
      es: "Debemos dejar en blanco el Seguro Social y otros datos sensibles?",
    },
    description: {
      en: "If yes, the app will keep those fields out of the printable packet.",
      es: "Si respondes que si, la app dejara esos campos fuera del paquete imprimible.",
    },
    options: [
      { label: { en: "Yes, leave them blank", es: "Si, dejarlos en blanco" }, value: true, tokens: yesTokens },
      { label: { en: "No, include later", es: "No, agregarlos despues" }, value: false, tokens: noTokens },
    ],
  },
  {
    key: "notes",
    type: "textarea",
    required: false,
    title: {
      en: "Any extra notes we should carry into the application drafts?",
      es: "Hay notas adicionales que debamos llevar a los borradores de solicitud?",
    },
    description: {
      en: "You can mention interpreter needs, work history, veteran status, or office preferences.",
      es: "Puedes mencionar necesidad de interprete, historial laboral, estatus de veterano o preferencia de oficina.",
    },
    placeholder: {
      en: "Optional notes",
      es: "Notas opcionales",
    },
  },
];

export function ConversationGuide({
  intake,
  currentStep,
  onAnswer,
  onBack,
  onNext,
  onFinish,
  onSpeak,
}: ConversationGuideProps) {
  const step = steps[currentStep];
  const language = intake.language;
  const isLastStep = currentStep === steps.length - 1;
  const currentValue = intake[step.key];

  const optionMap = useMemo(
    () =>
      (step.options ?? []).map((option) => ({
        value: option.value,
        tokens: option.tokens.map(normalizeVoiceText),
      })),
    [step.options],
  );

  const handleTranscript = useCallback(
    (transcript: string) => {
      const normalizedTranscript = normalizeVoiceText(transcript);

      if (step.key === "language") {
        const inferredLanguage = inferLanguageFromTranscript(normalizedTranscript);
        if (inferredLanguage) {
          onAnswer("language", inferredLanguage);
          return;
        }
      }

      if (step.type === "choice") {
        const matchedOption = optionMap.find((option) =>
          option.tokens.some((token) => normalizedTranscript.includes(token)),
        );

        if (matchedOption) {
          onAnswer(step.key, matchedOption.value as never);
        }
        return;
      }

      onAnswer(step.key, normalizeTranscriptForField(step.key, transcript) as never);
    },
    [onAnswer, optionMap, step],
  );

  const { isSupported, isListening, startListening } = useSpeechRecognition(language, handleTranscript);

  const canContinue =
    step.type === "choice"
      ? true
      : !step.required || String(currentValue ?? "").trim().length > 0;

  useEffect(() => {
    onSpeak(`${step.title[language]}. ${step.description[language]}`);
  }, [language, onSpeak, step.description, step.title]);

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const nextValue = event.target.value;
    onAnswer(step.key, normalizeInputValue(step.key, nextValue) as never);
  }

  return (
    <section className="panel mobile-panel guide-panel">
      <div className="section-heading">
        <span className="eyebrow">{language === "es" ? "Conversacion guiada" : "Guided conversation"}</span>
        <h2>{step.title[language]}</h2>
        <p>{step.description[language]}</p>
      </div>

      <div className="chat-thread">
        <div className="message message-assistant">
          <span className="message-role">Navigator</span>
          <p>{step.title[language]}</p>
        </div>

        {step.type === "choice" ? (
          <div className="quick-replies">
            {step.options?.map((option) => {
              const active = intake[step.key] === option.value;

              return (
                <button
                  key={`${String(step.key)}-${String(option.value)}`}
                  type="button"
                  className={active ? "reply-chip active" : "reply-chip"}
                  onClick={() => onAnswer(step.key, option.value as never)}
                >
                  {option.label[language]}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-answer">
            {step.type === "textarea" ? (
              <textarea
                value={String(currentValue ?? "")}
                onChange={handleFieldChange}
                rows={4}
                placeholder={step.placeholder?.[language]}
              />
            ) : (
              <input
                value={String(currentValue ?? "")}
                onChange={handleFieldChange}
                inputMode={step.inputMode}
                placeholder={step.placeholder?.[language]}
              />
            )}
          </div>
        )}
      </div>

      <div className="voice-row">
        <button
          type="button"
          className={isListening ? "voice-button listening" : "voice-button"}
          onClick={startListening}
          disabled={!isSupported}
        >
          {isListening
            ? language === "es"
              ? "Escuchando..."
              : "Listening..."
            : language === "es"
              ? "Responder con voz"
              : "Answer with voice"}
        </button>
        <small>
          {!isSupported
            ? language === "es"
              ? "La voz no esta disponible en este navegador."
              : "Voice input is not available in this browser."
            : step.type === "choice"
              ? language === "es"
                ? "Tambien puedes tocar una opcion."
                : "You can also tap an option."
              : language === "es"
                ? "La respuesta de voz llenara este campo."
                : "Voice will fill this field."}
        </small>
      </div>

      <div className="conversation-progress">
        <div className="progress-bar">
          <span style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
        </div>
        <small>
          {language === "es"
            ? `Paso ${currentStep + 1} de ${steps.length}`
            : `Step ${currentStep + 1} of ${steps.length}`}
        </small>
      </div>

      <div className="conversation-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onBack}
          disabled={currentStep === 0}
        >
          {language === "es" ? "Atras" : "Back"}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={isLastStep ? onFinish : onNext}
          disabled={!canContinue}
        >
          {isLastStep
            ? language === "es"
              ? "Ver resultados"
              : "See results"
            : language === "es"
              ? "Siguiente"
              : "Next"}
        </button>
      </div>
    </section>
  );
}

function normalizeVoiceText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferLanguageFromTranscript(transcript: string): Language | null {
  if (/\b(spanish|espanol|español|espanol por favor)\b/.test(transcript)) {
    return "es";
  }

  if (/\b(english|ingles|inglés|use english)\b/.test(transcript)) {
    return "en";
  }

  const spanishMarkers = ["hola", "necesito", "quiero", "ayuda", "beneficios", "aplicar"];
  const englishMarkers = ["hello", "need", "want", "help", "benefits", "apply"];

  const spanishHits = spanishMarkers.filter((token) => transcript.includes(token)).length;
  const englishHits = englishMarkers.filter((token) => transcript.includes(token)).length;

  if (spanishHits > englishHits && spanishHits > 0) {
    return "es";
  }

  if (englishHits > spanishHits && englishHits > 0) {
    return "en";
  }

  return null;
}

function normalizeTranscriptForField(
  key: keyof IntakeFormValue,
  transcript: string,
) {
  return normalizeInputValue(key, transcript);
}

function normalizeInputValue(
  key: keyof IntakeFormValue,
  value: string,
) {
  const trimmed = value.trim();

  if (key === "phone") {
    const digits = trimmed.replace(/[^\d+()-\s]/g, "");
    return digits;
  }

  if (key === "firstName" || key === "lastName" || key === "city") {
    return toTitleCase(trimmed);
  }

  return trimmed;
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}
