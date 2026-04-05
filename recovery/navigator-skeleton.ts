export type Screen = "welcome" | "intro" | "app";

export type AppTab = "chat" | "programs" | "apply";

export type Jurisdiction = "federal-us" | "texas" | "new-mexico" | "mexico";

export type Language = "en" | "es";

export interface BenefitProgram {
  id: string;
  name: string;
  nameEs: string;
  category: string;
  description: string;
  descriptionEs: string;
  eligibility: string;
  eligibilityEs: string;
  applyUrl: string;
  fplPercent: number;
  jurisdictions?: Jurisdiction[];
  requiresSensitiveInfo?: boolean;
}

export interface UserProfile {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  preferredLanguage?: Language;
  location?: {
    city?: string;
    stateOrRegion?: string;
    country?: string;
    zip?: string;
  };
  householdSize?: number;
  monthlyIncome?: number;
  age?: number;
  disabilityStatus?: boolean;
  blindOrLowVision?: boolean;
  pregnant?: boolean;
  hasChildrenUnderFive?: boolean;
  hasChildrenUnderNineteen?: boolean;
  needsUtilityHelp?: boolean;
  needsHousingHelp?: boolean;
  skipSensitiveInfo?: boolean;
  ssnLast4?: string;
}

export interface ChatTurn {
  role: "user" | "assistant" | "system";
  text: string;
  audioUrl?: string;
  createdAt: string;
}

export interface FormPacket {
  programId: string;
  printable: boolean;
  requiresManualFields: string[];
  generatedFileName: string;
}

export interface AppState {
  screen: Screen;
  activeTab: AppTab;
  language: Language;
  userInfo: UserProfile;
  matchedPrograms: Set<string>;
  conversation: ChatTurn[];
}

export const recoveredEndpoints = {
  programs: "/api/navigator/programs",
  generatePdf: "/api/navigator/generate-pdf",
  speechToText: "/api/navigator/stt",
  textToSpeech: "/api/navigator/tts",
  conversation: "/api/openai/conversations",
} as const;

export const targetFlow = [
  "welcome",
  "language selection",
  "jurisdiction triage",
  "rapid eligibility intake",
  "program matches",
  "optional form prefill",
  "printable packet",
] as const;

export const rebuildRules = {
  maxCompletionMinutes: 10,
  allowSensitiveInfoSkip: true,
  defaultOutput: "printable packet",
  voicePlayback: "start immediately after each assistant turn",
} as const;
