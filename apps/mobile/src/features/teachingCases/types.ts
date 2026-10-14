export type TeachingCaseFeedMode = "library" | "discussions";

export type TeachingCasePreview = {
  id: string;
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
  status: string;
  /** Case discussion lifecycle (web parity). */
  lifecycleStatus?: string | null;
  channelId: string | null;
  oradsCategory: number | null;
  tags: string[];
  createdAt: string;
};
