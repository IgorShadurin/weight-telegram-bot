import type { Language } from '../config.js';

export type GoalStatus = 'active' | 'achieved' | 'failed' | 'replaced';
export type PeriodStatus = 'pending' | 'passed' | 'missed';

export interface UserRecord {
  telegramUserId: string;
  username: string | null;
  displayName: string;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

export interface GoalRecord {
  id: string;
  telegramUserId: string;
  originChatId: string;
  originThreadId: string | null;
  startDate: string;
  startWeightGrams: number;
  targetWeightGrams: number;
  targetDate: string;
  status: GoalStatus;
  replacedByGoalId: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface GoalPeriodRecord {
  id: string;
  goalId: string;
  periodIndex: number;
  startDate: string;
  endDate: string;
  targetWeightGrams: number;
  status: PeriodStatus;
  passedAt: string | null;
  closedAt: string | null;
  badgeSentAt: string | null;
}

export interface WeighInRecord {
  id: string;
  goalId: string;
  periodId: string;
  telegramUserId: string;
  chatId: string;
  weightGrams: number;
  photoUniqueId: string;
  submittedAt: string;
}

export interface GoalDraft {
  telegramUserId: string;
  chatId: string;
  threadId: string | null;
  promptMessageId: number | null;
  initialWeightGrams: number | null;
  initialPhotoUniqueId: string | null;
  targetWeightGrams: number | null;
  targetDate: string | null;
  expiresAt: string;
}

export interface PeriodDefinition {
  periodIndex: number;
  startDate: string;
  endDate: string;
  targetWeightGrams: number;
}
