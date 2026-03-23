export const MANAGER_EMAIL = "rajeev.gill@omc.com";
export const COMPETITION_STATE_ID = 1;
export const TEMPLATE_SHEET_NAME = "Entries";
export const TEMPLATE_INSTRUCTIONS_SHEET = "Instructions";
export const FINALIZED_RESULTS_SHEET = "Finalized Scores";
export const MAX_TEAM_EMAIL_COLUMNS = 4;
export const VOTING_STATUSES = ["PREPARING", "OPEN", "FINALIZED"] as const;

export type VotingStatus = (typeof VOTING_STATUSES)[number];
