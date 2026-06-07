// SPEC.md Section 4.2 — Training Allocation per department
import type { Department } from '../types';

interface TrainingEntry {
  tier1_mandatory: number;
  tier2_department: number;
  tier3_leadership: number;
  totalMonthlyHours: number;
  topics: string[];
}

export const TRAINING: Record<Department, TrainingEntry> = {
  'AE/Strategy': {
    tier1_mandatory: 2,
    tier2_department: 3,
    tier3_leadership: 2,
    totalMonthlyHours: 7,
    topics: [
      'AI Foundation — mandatory for all staff (Platform KPI)',
      'Brief writing & pitching',
      'Leadership & feedback skills',
    ],
  },
  'Creative': {
    tier1_mandatory: 2,
    tier2_department: 2,
    tier3_leadership: 0,
    totalMonthlyHours: 4,
    topics: [
      'AI Foundation — mandatory for all staff',
      'AI tools & trend workshop',
    ],
  },
  'Content': {
    tier1_mandatory: 2,
    tier2_department: 2,
    tier3_leadership: 0,
    totalMonthlyHours: 4,
    topics: [
      'AI Foundation — mandatory for all staff',
      'Platform & algorithm updates',
    ],
  },
  'Media': {
    tier1_mandatory: 2,
    tier2_department: 2,
    tier3_leadership: 0,
    totalMonthlyHours: 4,
    topics: [
      'AI Foundation — mandatory for all staff',
      'Meta/Google/TikTok certification updates',
    ],
  },
  'KOL': {
    tier1_mandatory: 2,
    tier2_department: 1.5,
    tier3_leadership: 0,
    totalMonthlyHours: 3.5,
    topics: [
      'AI Foundation — mandatory for all staff',
      'Contract law & influencer vetting',
    ],
  },
  'Production': {
    tier1_mandatory: 2,
    tier2_department: 1,
    tier3_leadership: 0,
    totalMonthlyHours: 3,
    topics: [
      'AI Foundation — mandatory for all staff',
      'Safety & process SOP',
    ],
  },
  'Dev': {
    tier1_mandatory: 2,
    tier2_department: 1,
    tier3_leadership: 0,
    totalMonthlyHours: 3,
    topics: [
      'AI Foundation — mandatory for all staff',
      'Security & deployment best practices',
    ],
  },
  'Freelance': {
    tier1_mandatory: 1,
    tier2_department: 0,
    tier3_leadership: 0,
    totalMonthlyHours: 1,
    topics: ['Tool onboarding'],
  },
};
