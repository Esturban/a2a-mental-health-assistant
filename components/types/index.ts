/**
 * Shared Type Definitions for the Mental Health Booking Assistant
 */

import { ActionRenderProps } from "@copilotkit/react-core";

// ============================================================================
// A2A Action Types
// ============================================================================

export type MessageActionRenderProps = ActionRenderProps<
  [
    {
      readonly name: "agentName";
      readonly type: "string";
      readonly description: "The name of the A2A agent to send the message to";
    },
    {
      readonly name: "task";
      readonly type: "string";
      readonly description: "The message to send to the A2A agent";
    }
  ]
>;

export type CostApprovalActionRenderProps = ActionRenderProps<
  [
    {
      readonly name: "costEstimate";
      readonly type: "object";
      readonly description: "The therapy cost estimate requiring confirmation";
    }
  ]
>;

export type ClientIntakeActionRenderProps = ActionRenderProps<
  [
    {
      readonly name: "clientName";
      readonly type: "string";
      readonly description: "Preferred name of the client";
    },
    {
      readonly name: "primaryConcern";
      readonly type: "string";
      readonly description: "Main reason the client is seeking support";
    },
    {
      readonly name: "therapyGoals";
      readonly type: "string";
      readonly description: "Key outcomes the client is hoping for";
    },
    {
      readonly name: "preferredFormat";
      readonly type: "string";
      readonly description: "Preferred session format (in-person, virtual, hybrid)";
    },
    {
      readonly name: "availability";
      readonly type: "string";
      readonly description: "Days/times that work well for the client";
    },
    {
      readonly name: "insurance";
      readonly type: "string";
      readonly description: "Insurance provider or payment preference";
    },
    {
      readonly name: "notes";
      readonly type: "string";
      readonly description: "Additional context or safety considerations";
    }
  ]
>;

// ============================================================================
// Agent Data Structures
// ============================================================================

export interface SessionPlan {
  focus: string;
  modality: string;
  facilitatorProfile: string;
  keyObjectives: string[];
  betweenSessionSupport: string[];
}

export interface WeeklyPlan {
  week: number;
  theme: string;
  primarySession: SessionPlan;
  complementarySupport: string;
  notes: string;
}

export interface CarePlanData {
  clientName: string;
  durationWeeks: number;
  focusAreas: string[];
  plan: WeeklyPlan[];
  followUpRecommendations: string[];
  safetyConsiderations: string[];
}

export interface AvailabilitySlot {
  date: string;
  day: string;
  slots: string[];
  isVirtual: boolean;
}

export interface AvailabilityData {
  therapistName: string;
  credentials: string;
  modalities: string[];
  primaryFocus: string;
  availability: AvailabilitySlot[];
  bookingNotes: string;
  telehealthOptions: string[];
}

export interface ResourceItem {
  title: string;
  type: string;
  url: string;
  description: string;
  format: string;
}

export interface ResourceCategory {
  focusArea: string;
  description: string;
  resources: ResourceItem[];
}

export interface ResourceLibraryData {
  overview: string;
  categories: ResourceCategory[];
}

export interface CostBreakdownItem {
  category: string;
  amount: number;
  covered: boolean;
  notes: string;
}

export interface CostEstimateData {
  estimatedMonthlyCost: number;
  currency: string;
  coverageSummary: string;
  breakdown: CostBreakdownItem[];
  paymentConsiderations: string[];
}

// ============================================================================
// Component Props
// ============================================================================

export interface TherapyChatProps {
  onCarePlanUpdate?: (data: CarePlanData | null) => void;
  onAvailabilityUpdate?: (data: AvailabilityData | null) => void;
  onResourcesUpdate?: (data: ResourceLibraryData | null) => void;
  onCostUpdate?: (data: CostEstimateData | null) => void;
}

export interface AgentStyle {
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  framework: string;
}
