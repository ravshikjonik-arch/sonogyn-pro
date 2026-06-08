export type OrganType = "breast" | "ovary" | "uterus" | "lymph";

export type OradsSnapshot = {
  input: Record<string, unknown>;
  resultCategory?: string;
};

export type UserProfile = {
  id: string;
  points: number;
  level: number;
  name: string;
  isBanned?: boolean;
};

export type CaseRecord = {
  id: string;
  userId: string;
  organ: OrganType;
  description: string;
  imageUrl?: string;
  result?: string;
  oradsSnapshot?: OradsSnapshot;
  createdAt: number;
};

export type CommentRecord = {
  id: string;
  caseId: string;
  userId: string;
  text: string;
  createdAt: number;
};

export type CasePreview = {
  id: string;
  userId: string;
  organ: OrganType;
  description: string;
  image?: string;
  result?: string;
  oradsSnapshot?: OradsSnapshot;
  commentsCount: number;
  likesCount?: number;
  createdAt?: number;
  authorLevel?: number;
};
