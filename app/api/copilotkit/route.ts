/**
 * CopilotKit API Route with A2A Middleware
 *
 * Sets up the connection between:
 * - Frontend (CopilotKit) → A2A Middleware → Orchestrator → A2A Agents
 *
 * KEY CONCEPTS:
 * - AG-UI Protocol: Agent-UI communication (CopilotKit ↔ Orchestrator)
 * - A2A Protocol: Agent-to-agent communication (Orchestrator ↔ Specialized Agents)
 * - A2A Middleware: Injects send_message_to_a2a_agent tool to bridge AG-UI and A2A
 */

import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { A2AMiddlewareAgent } from "@ag-ui/a2a-middleware";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // STEP 1: Define A2A agent URLs
  const carePlanAgentUrl =
    process.env.CARE_PLAN_AGENT_URL || "http://localhost:9001";
  const insuranceAgentUrl =
    process.env.INSURANCE_AGENT_URL || "http://localhost:9002";
  const resourcesAgentUrl =
    process.env.RESOURCES_AGENT_URL || "http://localhost:9003";
  const availabilityAgentUrl =
    process.env.AVAILABILITY_AGENT_URL || "http://localhost:9005";

  // STEP 2: Define orchestrator URL (speaks AG-UI Protocol)
  const orchestratorUrl =
    process.env.ORCHESTRATOR_URL || "http://localhost:9000";

  // STEP 3: Wrap orchestrator with HttpAgent (AG-UI client)
  const orchestrationAgent = new HttpAgent({
    url: orchestratorUrl,
  });

  // STEP 4: Create A2A Middleware Agent
  // This bridges AG-UI and A2A protocols by:
  // 1. Wrapping the orchestrator
  // 2. Registering all A2A agents
  // 3. Injecting send_message_to_a2a_agent tool
  // 4. Routing messages between orchestrator and A2A agents
  const a2aMiddlewareAgent = new A2AMiddlewareAgent({
    description:
      "Mental health coordination assistant with four specialists: Care planning (LangGraph), Availability, Resources, and Insurance (ADK)",

    agentUrls: [
      carePlanAgentUrl, // LangGraph + OpenAI
      resourcesAgentUrl, // ADK + Gemini
      insuranceAgentUrl, // ADK + Gemini
      availabilityAgentUrl, // ADK + Gemini
    ],

    orchestrationAgent,

    // Middleware instructions could be added here if runtime orchestration needs to be overridden.
  });

  // STEP 5: Create CopilotKit Runtime
  const runtime = new CopilotRuntime({
    agents: {
      a2a_chat: a2aMiddlewareAgent, // Must match frontend: <CopilotKit agent="a2a_chat">
    },
  });

  // STEP 6: Set up Next.js endpoint handler
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(request);
}
