// Типы фичи "Опросы" — должны совпадать с ru.bormash.servicedesk.feature.survey.dto.*
// questions/data — сырой SurveyJS JSON ({"elements": [...]}), бэк его не типизирует (см. SurveyService)

export interface CreateSurveyRequest {
  title: string; // required, max 250
  description?: string; // max 2000
  anonymous: boolean;
  endDate: string; // ISO 8601, обязана быть в будущем
  questions: SurveyElementsJson;
  departmentIds?: number[];
  userIds?: number[];
}

export interface SubmitSurveyAnswersRequest {
  data: Record<string, unknown>;
}

export interface MySurveyResponse {
  id: number;
  title: string;
  description: string | null;
  endDate: string;
  responded: boolean;
  expired: boolean;
}

export interface SurveyDetailResponse {
  id: number;
  title: string;
  description: string | null;
  anonymous: boolean;
  endDate: string;
  questions: SurveyElementsJson;
  alreadyAnswered: boolean;
}

export interface SurveyManagementResponse {
  id: number;
  title: string;
  endDate: string;
  closedAt: string | null;
  anonymous: boolean;
  questionCount: number;
  totalRecipients: number;
  totalResponded: number;
  createdAt: string;
  targetDepartmentNames: string[];
  targetUserNames: string[];
}

// ─── SurveyJS JSON (совместимо с survey-core) ──────────────

export type SurveyQuestionType = "radiogroup" | "checkbox" | "text" | "comment";

export interface SurveyChoice {
  value: string;
  text: string;
}

export interface SurveyElement {
  type: SurveyQuestionType;
  name: string;
  title: string;
  isRequired?: boolean;
  choices?: SurveyChoice[];
}

export interface SurveyElementsJson {
  elements: SurveyElement[];
}

export const SURVEY_QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  radiogroup: "Один вариант ответа",
  checkbox: "Несколько вариантов ответа",
  text: "Короткий текст",
  comment: "Развёрнутый текст",
};
