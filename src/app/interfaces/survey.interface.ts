export interface Question {
  text: string;
  multiple_choice: boolean;
  options: string[];
}

export interface Survey {
  id: number;
  title: string;
  description: string | null;
  category: string;
  end_date: string | null;
  questions: Question[];
  created_at: string;
}

export interface Vote {
  id: number;
  survey_id: number;
  question_index: number;
  option_index: number;
  created_at: string;
}

export type NewSurvey = Omit<Survey, 'id' | 'created_at'>;
export type NewVote = Omit<Vote, 'id' | 'created_at'>;