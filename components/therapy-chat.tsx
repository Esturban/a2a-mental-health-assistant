"use client";

import React, { useState, useEffect } from "react";
import { CopilotKit, useCopilotChat, useCopilotAction } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "./style.css";

import type {
  TherapyChatProps,
  CarePlanData,
  AvailabilityData,
  ResourceLibraryData,
  CostEstimateData,
  MessageActionRenderProps,
} from "./types";

import { MessageToA2A } from "./a2a/MessageToA2A";
import { MessageFromA2A } from "./a2a/MessageFromA2A";
import { ClientIntakeForm } from "./forms/ClientIntakeForm";
import { CostApprovalCard } from "./hitl/CostApprovalCard";
import { AvailabilityCard } from "./AvailabilityCard";

const ChatInner = ({
  onCarePlanUpdate,
  onAvailabilityUpdate,
  onResourcesUpdate,
  onCostUpdate,
}: TherapyChatProps) => {
  const [approvalStates, setApprovalStates] = useState<
    Record<string, { approved: boolean; rejected: boolean }>
  >({});

  const { visibleMessages } = useCopilotChat();

  useEffect(() => {
    const extractDataFromMessages = () => {
      for (const message of visibleMessages) {
        const msg = message as any;
        if (
          msg.type === "ResultMessage" &&
          msg.actionName === "send_message_to_a2a_agent"
        ) {
          try {
            const result = msg.result;
            let parsed: any;

            if (typeof result === "string") {
              let cleanResult = result;
              if (result.startsWith("A2A Agent Response: ")) {
                cleanResult = result.substring("A2A Agent Response: ".length);
              }
              parsed = JSON.parse(cleanResult);
            } else if (typeof result === "object" && result !== null) {
              parsed = result;
            }

            if (!parsed) continue;

            if (
              parsed.clientName &&
              parsed.plan &&
              Array.isArray(parsed.plan)
            ) {
              onCarePlanUpdate?.(parsed as CarePlanData);
            } else if (
              parsed.estimatedMonthlyCost &&
              parsed.breakdown &&
              Array.isArray(parsed.breakdown)
            ) {
              const costKey = `cost-${parsed.estimatedMonthlyCost}`;
              const isApproved = approvalStates[costKey]?.approved || false;
              if (isApproved) {
                onCostUpdate?.(parsed as CostEstimateData);
              }
            } else if (
              parsed.therapistName &&
              parsed.availability &&
              Array.isArray(parsed.availability)
            ) {
              onAvailabilityUpdate?.(parsed as AvailabilityData);
            } else if (
              parsed.categories &&
              Array.isArray(parsed.categories)
            ) {
              onResourcesUpdate?.(parsed as ResourceLibraryData);
            }
          } catch (error) {
            // Ignore parsing failures - some messages may be plain text
          }
        }
      }
    };

    extractDataFromMessages();
  }, [
    visibleMessages,
    approvalStates,
    onCarePlanUpdate,
    onAvailabilityUpdate,
    onResourcesUpdate,
    onCostUpdate,
  ]);

  useCopilotAction({
    name: "send_message_to_a2a_agent",
    description: "Sends a message to an A2A agent",
    available: "frontend",
    parameters: [
      {
        name: "agentName",
        type: "string",
        description: "The name of the A2A agent to send the message to",
      },
      {
        name: "task",
        type: "string",
        description: "The message to send to the A2A agent",
      },
    ],
    render: (actionRenderProps: MessageActionRenderProps) => {
      return (
        <>
          <MessageToA2A {...actionRenderProps} />
          <MessageFromA2A {...actionRenderProps} />
        </>
      );
    },
  });

  useCopilotAction(
    {
      name: "request_cost_confirmation",
      description: "Request human confirmation before finalizing pricing",
      parameters: [
        {
          name: "costEstimate",
          type: "object",
          description: "Structured cost estimate to review",
        },
      ],
      renderAndWaitForResponse: ({ args, respond }) => {
        if (!args.costEstimate || typeof args.costEstimate !== "object") {
          return (
            <div className="text-xs text-gray-500 p-2">Loading cost estimate...</div>
          );
        }

        const estimate = args.costEstimate as CostEstimateData;
        if (!estimate.estimatedMonthlyCost || !estimate.breakdown) {
          return (
            <div className="text-xs text-gray-500 p-2">Loading cost estimate...</div>
          );
        }

        const costKey = `cost-${estimate.estimatedMonthlyCost}`;
        const current = approvalStates[costKey] || {
          approved: false,
          rejected: false,
        };

        const handleApprove = () => {
          setApprovalStates((prev) => ({
            ...prev,
            [costKey]: { approved: true, rejected: false },
          }));
          respond?.({ approved: true, message: "Cost estimate approved" });
        };

        const handleReject = () => {
          setApprovalStates((prev) => ({
            ...prev,
            [costKey]: { approved: false, rejected: true },
          }));
          respond?.({ approved: false, message: "Cost estimate rejected" });
        };

        return (
          <CostApprovalCard
            costEstimate={estimate}
            isApproved={current.approved}
            isRejected={current.rejected}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      },
    },
    [approvalStates]
  );

  useCopilotAction({
    name: "collect_client_intake",
    description: "Collect intake information before recommending therapists",
    parameters: [
      {
        name: "clientName",
        type: "string",
        description: "Preferred client name",
        required: false,
      },
      {
        name: "primaryConcern",
        type: "string",
        description: "Primary challenge to address",
        required: false,
      },
      {
        name: "therapyGoals",
        type: "string",
        description: "Top goals for therapy",
        required: false,
      },
      {
        name: "preferredFormat",
        type: "string",
        description: "Session format preference",
        required: false,
      },
      {
        name: "availability",
        type: "string",
        description: "Days/times that work well",
        required: false,
      },
      {
        name: "insurance",
        type: "string",
        description: "Insurance or payment preferences",
        required: false,
      },
      {
        name: "notes",
        type: "string",
        description: "Additional context or safety considerations",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond }) => {
      return <ClientIntakeForm args={args} respond={respond} />;
    },
  });

  useCopilotAction({
    name: "display_availability_preview",
    description: "Render therapist availability inline in the chat",
    available: "frontend",
    parameters: [
      {
        name: "availability",
        type: "object",
        description: "Availability data from the availability agent",
      },
    ],
    render: ({ args }) => {
      if (!args.availability || typeof args.availability !== "object") {
        return <></>;
      }

      const availability = args.availability as AvailabilityData;
      if (!availability.therapistName || !availability.availability) {
        return <></>;
      }

      return (
        <div className="my-3">
          <AvailabilityCard data={availability} />
        </div>
      );
    },
  });

  return (
    <div className="h-full">
      <CopilotChat
        className="h-full"
        labels={{
          initial:
            "👋 Hi! I'm your care coordination assistant.\n\nShare what support you're looking for and I'll help match you with therapists, outline a care plan, and coordinate next steps.",
        }}
        instructions="You are a supportive mental health booking assistant. Coordinate with your specialized agents to gather intake details, recommend therapists, outline a care plan, and prepare cost information."
      />
    </div>
  );
};

export default function TherapyChat({
  onCarePlanUpdate,
  onAvailabilityUpdate,
  onResourcesUpdate,
  onCostUpdate,
}: TherapyChatProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false} agent="a2a_chat">
      <ChatInner
        onCarePlanUpdate={onCarePlanUpdate}
        onAvailabilityUpdate={onAvailabilityUpdate}
        onResourcesUpdate={onResourcesUpdate}
        onCostUpdate={onCostUpdate}
      />
    </CopilotKit>
  );
}
