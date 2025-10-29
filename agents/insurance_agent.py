"""
Insurance Agent (ADK + A2A Protocol)

Produces therapy cost estimates with insurance coverage assumptions. Exposes an
A2A Protocol endpoint for the orchestrator.
"""

import uvicorn
import os
import json
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import new_agent_text_message

from google.adk.agents.llm_agent import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.artifacts import InMemoryArtifactService
from google.genai import types


class CostBreakdownItem(BaseModel):
    category: str = Field(description="Expense category")
    amount: float = Field(description="Estimated amount in currency")
    covered: bool = Field(description="Whether insurance is expected to cover it")
    notes: str = Field(description="Notes about the estimate")


class StructuredCostEstimate(BaseModel):
    estimatedMonthlyCost: float = Field(description="Estimated monthly total cost")
    currency: str = Field(default="USD", description="Currency code")
    coverageSummary: str = Field(description="Explanation of insurance assumptions")
    breakdown: List[CostBreakdownItem] = Field(description="Line item breakdown")
    paymentConsiderations: List[str] = Field(description="Next steps or billing notes")


class InsuranceAgent:
    def __init__(self):
        self._agent = self._build_agent()
        self._user_id = "remote_agent"
        self._runner = Runner(
            app_name=self._agent.name,
            agent=self._agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )

    def _build_agent(self) -> LlmAgent:
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        return LlmAgent(
            model=model_name,
            name="insurance_agent",
            description="Estimates therapy costs and insurance coverage",
            instruction="""
You are a behavioral health billing specialist. Given session frequency,
modality, and any insurance information, estimate the monthly cost of care.
Return ONLY JSON with this structure:
{
  "estimatedMonthlyCost": 480.0,
  "currency": "USD",
  "coverageSummary": "Covers 70% of in-network telehealth sessions after deductible",
  "breakdown": [
    {
      "category": "Weekly 60-minute therapy",
      "amount": 520.0,
      "covered": true,
      "notes": "Based on $130 contracted rate with 4 sessions per month"
    }
  ],
  "paymentConsiderations": [
    "Confirm deductible status",
    "Offer sliding scale if OON"
  ]
}

Guidelines:
- Use realistic outpatient therapy rates for the specified region (assume US if unknown).
- Call out what happens if the provider is out-of-network or if deductible applies.
- Include supervision/group fees if hinted in the request.
- Mention next steps (e.g., verify benefits, sliding scale conversation).
Return ONLY JSON.
            """,
            tools=[],
        )

    async def invoke(self, query: str, session_id: str) -> str:
        session = await self._runner.session_service.get_session(
            app_name=self._agent.name,
            user_id=self._user_id,
            session_id=session_id,
        )
        content = types.Content(role="user", parts=[types.Part.from_text(text=query)])
        if session is None:
            session = await self._runner.session_service.create_session(
                app_name=self._agent.name,
                user_id=self._user_id,
                state={},
                session_id=session_id,
            )

        response = await self._runner.run(
            user_id=self._user_id,
            session_id=session_id,
            content=content,
        )
        text = "".join(part.text or "" for part in response.output_content.parts)
        try:
            data = json.loads(text)
            StructuredCostEstimate(**data)
            return json.dumps(data, indent=2)
        except Exception as exc:
            return json.dumps({
                "error": "Failed to produce cost estimate",
                "details": str(exc),
                "raw": text,
            })


port = int(os.getenv("INSURANCE_PORT", 9002))

skill = AgentSkill(
    id="insurance_agent",
    name="Insurance & Cost Agent",
    description="Estimates therapy costs with coverage assumptions",
    tags=["insurance", "billing", "therapy"],
    examples=[
        "Estimate costs for weekly telehealth with BCBS",
        "Outline private pay vs. sliding scale for trauma therapy",
    ],
)

public_agent_card = AgentCard(
    name="Insurance Agent",
    description="Creates coverage summaries and actionable billing notes.",
    url=f"http://localhost:{port}/",
    version="1.0.0",
    defaultInputModes=["text"],
    defaultOutputModes=["text"],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)


class InsuranceAgentExecutor(AgentExecutor):
    def __init__(self):
        self.agent = InsuranceAgent()

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        result = await self.agent.invoke(context.message.parts[0].root.text, context.task_id)
        await event_queue.enqueue_event(new_agent_text_message(result))

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise Exception("cancel not supported")


def main():
    if not os.getenv("GOOGLE_API_KEY"):
        print("⚠️  Warning: GOOGLE_API_KEY environment variable not set!")
        print("   Set it with: export GOOGLE_API_KEY='your-key-here'")
        print()

    request_handler = DefaultRequestHandler(
        agent_executor=InsuranceAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"💳 Starting Insurance Agent (ADK + A2A) on http://localhost:{port}")
    uvicorn.run(server.build(), host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
