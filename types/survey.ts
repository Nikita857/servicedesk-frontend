import type {
  CreateSurveyRequest as WireCreateSurvey,
  MySurveyResponse as WireMine,
  SurveyDetailResponse as WireDetail,
  SurveyManagementResponse as WireManagement,
} from '@/lib/api/generated/models';

// The form supplies a structured SurveyJS editor value for the generated JSON object.
export type CreateSurveyRequest = Omit<WireCreateSurvey, 'questions' | 'anonymous'> & {
  questions: SurveyElementsJson;
  anonymous: boolean;
};
export type { SubmitSurveyAnswersRequest } from '@/lib/api/generated/models';

export type MySurveyResponse = Omit<Required<WireMine>, 'description'> & { description: string | null };
export type SurveyDetailResponse = Omit<Required<WireDetail>, 'description' | 'questions'> & {
  description: string | null;
  questions: SurveyElementsJson;
};
export type SurveyManagementResponse = Omit<Required<WireManagement>, 'closedAt'> & { closedAt: string | null };

// SurveyJS form/editor models remain hand-written UI types.
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
  [key: string]: unknown;
  elements: SurveyElement[];
}

export const SURVEY_QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  radiogroup: "Один вариант ответа",
  checkbox: "Несколько вариантов ответа",
  text: "Короткий текст",
  comment: "Развёрнутый текст",
};
