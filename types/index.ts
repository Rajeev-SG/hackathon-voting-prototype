export type ProjectStatus = "not-started" | "in-progress" | "scored";
export type ScoreboardStatus = "finalist" | "tied" | "qualified";

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
  avatar: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  benchmark: string;
  defaultScore: string;
}

export interface Project {
  slug: string;
  name: string;
  teamName: string;
  track: string;
  booth: string;
  boothLocation: string;
  status: ProjectStatus;
  score: number;
  judgingProgress: number;
  pitch: string;
  summary: string;
  heroImage: string;
  gallery: string[];
  techStack: string[];
  description: string[];
  links: {
    github: string;
    demo: string;
  };
  team: TeamMember[];
  submissionStatus: string;
  tags: string[];
  assignedJudge: string;
  lastUpdated: string;
}

export interface TieBreakCase {
  id: string;
  label: string;
  leftProject: string;
  rightProject: string;
  score: number;
  image: string;
}

export interface ScoreboardEntry {
  slug: string;
  rank: number;
  status: ScoreboardStatus;
  score: number;
  label: string;
}

export interface AssetDraft {
  projectSlug: string;
  videoDemo: string;
  screenshots: string[];
  hasHeroImage: boolean;
  readinessTip: string;
}
