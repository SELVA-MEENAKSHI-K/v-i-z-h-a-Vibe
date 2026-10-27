// Shared AI types. All AI output is advisory and must be labeled as generated,
// never presented as confirmed prices, availability, or venue facts.

export type AiContext = {
  eventTypeSlug?: string;
  eventTypeName?: string;
  categoryName?: string;
  city?: string;
  guestCount?: number;
  budget?: number;
  styles?: string[];
  dietary?: string;
  startDate?: string;
};

export type ThemeSuggestion = {
  title: string;
  palette: string[];
  summary: string;
  decorHighlights: string[];
  representableIn3D: string[]; // what can be shown in the planner
};

export type DecorConcept = {
  title: string;
  description: string;
  representableIn3D: string[];
  notRepresentable: string[];
};

export type MenuCourse = { course: string; items: string[] };
export type MenuSuggestion = {
  style: string;
  dietary: string;
  courses: MenuCourse[];
  notes: string;
};

export type BudgetLine = {
  category: string;
  label: string;
  quantity: number;
  unitCostMin: number;
  unitCostMax: number;
  assumption: string;
};
export type BudgetEstimate = {
  currency: "INR";
  lines: BudgetLine[];
  totalMin: number;
  totalMax: number;
  assumptions: string[];
};

export type TimelineTaskSuggestion = {
  title: string;
  detail: string;
  offsetDays: number; // days before event
};

export type AiResult =
  | { kind: "theme"; provider: string; generated: true; themes: ThemeSuggestion[] }
  | { kind: "decor"; provider: string; generated: true; concepts: DecorConcept[] }
  | { kind: "menu"; provider: string; generated: true; menus: MenuSuggestion[] }
  | { kind: "budget"; provider: string; generated: true; estimate: BudgetEstimate }
  | { kind: "timeline"; provider: string; generated: true; tasks: TimelineTaskSuggestion[] };

export interface AiProvider {
  name: string;
  recommend(kind: AiResult["kind"], ctx: AiContext): Promise<AiResult>;
  chat(message: string, ctx: AiContext, history?: { role: "user" | "assistant"; content: string }[]): Promise<string>;
}
