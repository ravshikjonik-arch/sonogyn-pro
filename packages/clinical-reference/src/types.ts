export type ClinicalTopic = {
  id: string;
  title: string;
  section: string;
  tags: string[];
  summary: string;
  methodology: string;
  sources: string[];
};

export type ClinicalReferenceIndex = {
  id: string;
  title: string;
  version: string;
  builtAt: string;
  topics: ClinicalTopic[];
};

export type ReferenceSearchHit = {
  topicId: string;
  title: string;
  section: string;
  snippet: string;
  score: number;
};

export type FieldHelpSnippet = {
  topicId: string;
  title: string;
  content: string;
};
