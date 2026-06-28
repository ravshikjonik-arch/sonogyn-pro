export type TeachingCaseFeedMode = "library" | "discussions";

export type TeachingCasePreview = {
  id: string;
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
  status: string;
  channelId: string | null;
  oradsCategory: number | null;
  tags: string[];
  createdAt: string;
};
