import { useMemo, useState } from "react";
import { ApplyNow } from "./components/ApplyNow";
import { ConversationGuide } from "./components/ConversationGuide";
import { OfficialFormDetails } from "./components/OfficialFormDetails";
import { OfficialPdfDownloads } from "./components/OfficialPdfDownloads";
import { ProgramDetailIntake } from "./components/ProgramDetailIntake";
import { ProgramMatches } from "./components/ProgramMatches";
import { programs } from "./data/programs";
import { useInstantSpeech } from "./hooks/useInstantSpeech";
import {
  IntakeForm as IntakeFormValue,
  buildAssistantSummary,
  buildResultsNarration,
  matchPrograms,
} from "./lib/matching";

const initialState: IntakeFormValue = {
  language: "en",
  firstName: "",
  lastName: "",
  middleName: "",
  city: "El Paso",
  region: "texas",
  ageBand: "18-64",
  householdSize: "1",
  monthlyIncomeBand: "1000-2000",
  hasDisability: false,
  pregnantOrPostpartum: false,
  childrenUnder5: false,
  childrenUnder19: false,
  needsHousingHelp: false,
  needsUtilityHelp: false,
  skipSensitiveInfo: true,
  address: "",
  phone: "",
  cellPhone: "",
  email: "",
  zipCode: "",
  county: "",
  dateOfBirth: "",
  socialSecurityNumber: "",
  spouseName: "",
  plansToFileTaxes: "",
  filesJointly: "",
  claimsDependents: "",
  dependentNames: "",
  claimedAsDependent: "",
  taxFilerName: "",
  taxRelationship: "",
  isVeteran: false,
  isActiveDuty: false,
  needsInterviewHelp: false,
  interviewHelpDetails: "",
  interviewLanguage: "",
  needsInterpreter: false,
  interpreterLanguage: "",
  preferredContactMethod: "",
  notes: "",
  employmentStatus: "",
  employerName: "",
  monthlyRent: "",
  currentInsurance: "",
  childrenNames: "",
  childDiagnosis: "",
  heatingType: "",
  lastUtilityBill: "",
};

function App() {
  const [intake, setIntake] = useState(initialState);
  const [stage, setStage] = useState<"guide" | "results" | "detail" | "apply">("guide");
  const [currentStep, setCurrentStep] = useState(0);
  const { speak } = useInstantSpeech();

  const matches = useMemo(() => matchPrograms(intake, programs), [intake]);
  const assistantSummary = useMemo(
    () => buildAssistantSummary(intake, matches.length),
    [intake, matches.length],
  );

  function updateField<Key extends keyof IntakeFormValue>(
    key: Key,
    nextValue: IntakeFormValue[Key],
  ) {
    setIntake((current) => {
      const nextState = {
        ...current,
        [key]: nextValue,
      };

      if (key === "childrenUnder5" && nextValue === true) {
        nextState.childrenUnder19 = true;
      }

      return nextState;
    });
  }

  function handleSubmit() {
    setStage("results");
    speak(buildResultsNarration(intake, matches), intake.language);
  }

  function handleGuideAnswer<Key extends keyof IntakeFormValue>(
    key: Key,
    value: IntakeFormValue[Key],
  ) {
    updateField(key, value);
  }

  function handleNextStep() {
    setCurrentStep((current) => current + 1);
  }

  function handleBackStep() {
    setCurrentStep((current) => Math.max(current - 1, 0));
  }

  function handleGoToDetail() {
    setStage("detail");
    speak(
      intake.language === "es"
        ? "Primero necesito algunos detalles especificos para cada programa."
        : "Let me ask a few more details specific to each program.",
      intake.language,
    );
  }

  function handleStartApplication() {
    setStage("apply");
    speak(
      intake.language === "es"
        ? "Tus solicitudes estan listas."
        : "Your applications are ready.",
      intake.language,
    );
  }

  return (
    <div className="app-shell">
      <main className="mobile-shell">
        <header className="mobile-header">
          <span className="eyebrow">Navigator</span>
          <h1>{intake.language === "es" ? "Ayuda con beneficios" : "Benefits help"}</h1>
          <p>
            {intake.language === "es"
              ? "Flujo bilingue con voz mas rapida, aplicaciones preparadas y paquete imprimible por beneficio."
              : "Bilingual flow with faster voice, prepared applications, and a printable packet for each benefit."}
          </p>
          <p className="voice-disclosure">
            {intake.language === "es"
              ? "La voz es generada por IA, no una grabacion humana."
              : "Voice audio is AI-generated, not a human recording."}
          </p>
        </header>

        {stage === "guide" ? (
          <ConversationGuide
            intake={intake}
            currentStep={currentStep}
            onAnswer={handleGuideAnswer}
            onBack={handleBackStep}
            onNext={handleNextStep}
            onFinish={handleSubmit}
            onSpeak={(text) => speak(text, intake.language)}
          />
        ) : null}

        {stage === "results" ? (
          <section className="panel mobile-panel">
            <div className="section-heading">
              <span className="eyebrow">{intake.language === "es" ? "Resultados" : "Results"}</span>
              <h2>{intake.language === "es" ? "Beneficios encontrados" : "Benefits found"}</h2>
              <p>{assistantSummary}</p>
            </div>

            <ProgramMatches matches={matches.slice(0, 4)} language={intake.language} />

            <div className="apply-question">
              <h3>
                {intake.language === "es"
                  ? "Quieres continuar con las solicitudes?"
                  : "Ready to build your applications?"}
              </h3>
              <div className="apply-actions">
                <button className="primary-button" type="button" onClick={handleGoToDetail}>
                  {intake.language === "es" ? "Si, continuar" : "Yes, continue"}
                </button>
                <button className="secondary-button" type="button" onClick={() => setStage("guide")}>
                  {intake.language === "es" ? "Cambiar respuestas" : "Change answers"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {stage === "detail" ? (
          <ProgramDetailIntake
            intake={intake}
            matches={matches}
            onChange={handleGuideAnswer}
            onBack={() => setStage("results")}
            onContinue={handleStartApplication}
          />
        ) : null}

        {stage === "apply" ? (
          <>
            <OfficialFormDetails intake={intake} onChange={handleGuideAnswer} />
            <OfficialPdfDownloads intake={intake} matches={matches} />
            <ApplyNow intake={intake} matches={matches} />
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
