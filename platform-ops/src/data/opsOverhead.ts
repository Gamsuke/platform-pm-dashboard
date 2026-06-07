// SPEC.md Section 4.1 — Ops Overhead per department
import type { Department } from '../types';

interface OpsEntry {
  hoursPerWeek: number;
  items: string[];
}

export const OPS_OVERHEAD: Record<Department, OpsEntry> = {
  'AE/Strategy': {
    hoursPerWeek: 9,
    items: [
      'Meeting notes & minutes',
      'Client emails & status reports',
      'Brief writing & revisions',
    ],
  },
  'Creative': {
    hoursPerWeek: 5,
    items: [
      'Revision logging',
      'Asset naming & filing',
      'Brief comprehension time',
    ],
  },
  'Content': {
    hoursPerWeek: 6,
    items: [
      'Caption edits & approval tracking',
      'Platform uploads',
      'Copy alignment rounds',
    ],
  },
  'Media': {
    hoursPerWeek: 7,
    items: [
      'Report pulls & dashboard updates',
      'Vendor coordination',
      'Billing reconciliation',
    ],
  },
  'KOL': {
    hoursPerWeek: 8,
    items: [
      'Contract admin',
      'Influencer tracking sheet',
      'Follow-up & seeding logistics',
    ],
  },
  'Production': {
    hoursPerWeek: 5.5,
    items: [
      'Supplier POs',
      'File management & QC checklists',
      'Delivery coordination',
    ],
  },
  'Dev': {
    hoursPerWeek: 4.5,
    items: [
      'Bug logs & deployment notes',
      'Documentation',
      'Code review coordination',
    ],
  },
  'Freelance': {
    hoursPerWeek: 2.5,
    items: [
      'Brief intake',
      'Revision rounds',
      'File handoff',
    ],
  },
};
