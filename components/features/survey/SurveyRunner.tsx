"use client";

import { useEffect, useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/russian";
import type { SurveyElementsJson } from "@/types/survey";

interface SurveyRunnerProps {
  questions: SurveyElementsJson;
  onComplete: (data: Record<string, unknown>) => void;
}

export function SurveyRunner({ questions, onComplete }: SurveyRunnerProps) {
  const model = useMemo(() => {
    const m = new Model(questions);
    m.locale = "ru";
    m.showCompletedPage = false;
    m.completeText = "Отправить";
    return m;
  }, [questions]);

  useEffect(() => {
    const handler = (sender: Model) => onComplete(sender.data as Record<string, unknown>);
    model.onComplete.add(handler);
    return () => model.onComplete.remove(handler);
  }, [model, onComplete]);

  return <Survey model={model} />;
}
