export type TeachingCasePreview = {
  id: string;
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
  status: string;
  oradsCategory: number | null;
  tags: string[];
  createdAt: string;
};
