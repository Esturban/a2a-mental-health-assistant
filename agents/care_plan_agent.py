"""
Care Plan Agent (LangGraph + A2A Protocol)

This agent designs a structured multi-week therapy roadmap based on intake
information. It exposes an A2A Protocol endpoint so it can be called by the
orchestrator.
"""

import uvicorn
import json
import os
from dotenv import load_dotenv

load_dotenv()

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill, Message
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import new_agent_text_message

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI

from typing import TypedDict, List, Optional
from pydantic import BaseModel, Field


class SessionPlan(BaseModel):
    focus: str = Field(description="Session focus and interventions")
    modality: str = Field(description="Primary modality for this session")
    facilitatorProfile: str = Field(description="Therapist profile best suited")
    keyObjectives: List[str] = Field(description="Session objectives")
    betweenSessionSupport: List[str] = Field(description="Homework or support between sessions")


class WeeklyPlan(BaseModel):
    week: int = Field(description="Week number")
    theme: str = Field(description="Week theme or title")
    primarySession: SessionPlan = Field(description="Primary session details")
    complementarySupport: str = Field(description="Complementary practice or collaboration")
    notes: str = Field(description="Notes for therapist coordination")


class StructuredCarePlan(BaseModel):
    clientName: str = Field(description="Client's preferred name")
    durationWeeks: int = Field(description="Number of weeks in the plan")
    focusAreas: List[str] = Field(description="Key focus areas and goals")
    plan: List[WeeklyPlan] = Field(description="Week-by-week plan")
    followUpRecommendations: List[str] = Field(description="Recommended next steps after plan completes")
    safetyConsiderations: List[str] = Field(description="Important safety or access notes")


class CarePlanState(TypedDict):
    message: str
    intake_summary: str
    care_plan_json: str
    structured_plan: Optional[dict]


class CarePlanAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(CarePlanState)
        workflow.add_node("summarize_intake", self._summarize_intake)
        workflow.add_node("create_care_plan", self._create_care_plan)
        workflow.set_entry_point("summarize_intake")
        workflow.add_edge("summarize_intake", "create_care_plan")
        workflow.add_edge("create_care_plan", END)
        return workflow.compile()

    def _summarize_intake(self, state: CarePlanState) -> CarePlanState:
        message = state["message"]
        prompt = f"""
        You are supporting a therapist onboarding a client. Extract the core intake
        information from the following request and return a concise JSON summary
        with these keys: clientName, primaryConcern, therapyGoals, preferredFormat,
        availability, insurance, safetyNotes.

        If an item is unknown, use "" for strings.

        Request: {message}
        """
        response = self.llm.invoke(prompt)
        try:
            summary = json.loads(response.content)
        except Exception:
            summary = {
                "clientName": "Client",
                "primaryConcern": message,
                "therapyGoals": "",
                "preferredFormat": "virtual",
                "availability": "",
                "insurance": "",
                "safetyNotes": "",
            }
        state["intake_summary"] = json.dumps(summary)
        return state

    def _create_care_plan(self, state: CarePlanState) -> CarePlanState:
        intake = state["intake_summary"]
        prompt = f"""
        You are a clinical operations specialist building a therapy roadmap.
        Using the following intake summary, create a detailed plan that spans
        4 to 6 weeks.

        Intake summary (JSON): {intake}

        Return ONLY valid JSON with this structure:
        {{
          "clientName": "name",
          "durationWeeks": 6,
          "focusAreas": ["area1", "area2"],
          "plan": [
            {{
              "week": 1,
              "theme": "Short title",
              "primarySession": {{
                "focus": "Primary therapeutic focus",
                "modality": "Modality used",
                "facilitatorProfile": "Therapist profile",
                "keyObjectives": ["objective1", "objective2"],
                "betweenSessionSupport": ["support1", "support2"]
              }},
              "complementarySupport": "Group support, collaboration, or practice",
              "notes": "Any coordination notes or safety reminders"
            }}
          ],
          "followUpRecommendations": ["next step"],
          "safetyConsiderations": ["note"]
        }}

        Tailor the plan to the intake details, highlight coping skills, and
        ensure the tone is supportive and clinician-ready.
        """
        response = self.llm.invoke(prompt)
        content = response.content.strip()
        if "```" in content:
            content = content.split("```")[-2].strip()
        try:
            structured_data = json.loads(content)
            validated = StructuredCarePlan(**structured_data)
            state["structured_plan"] = validated.model_dump()
            state["care_plan_json"] = json.dumps(validated.model_dump(), indent=2)
        except Exception as exc:
            state["structured_plan"] = None
            state["care_plan_json"] = json.dumps({
                "error": "Failed to build care plan",
                "details": str(exc),
                "raw": content[:200],
            })
        return state

    async def invoke(self, message: Message) -> str:
        message_text = message.parts[0].root.text
        result = self.graph.invoke({
            "message": message_text,
            "intake_summary": "",
            "care_plan_json": "",
            "structured_plan": None,
        })
        return result["care_plan_json"]


port = int(os.getenv("CARE_PLAN_PORT", 9001))

skill = AgentSkill(
    id="care_plan_agent",
    name="Care Planning Agent",
    description="Creates multi-week therapy plans with goals and homework",
    tags=["care", "therapy", "planning"],
    examples=[
        "Create a trauma-informed plan for a client with evening availability",
        "Design six weeks of CBT-oriented sessions for anxiety",
    ],
)

public_agent_card = AgentCard(
    name="Care Plan Agent",
    description="Designs therapy roadmaps with session objectives and between-session support.",
    url=f"http://localhost:{port}/",
    version="1.0.0",
    defaultInputModes=["text"],
    defaultOutputModes=["text"],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)


class CarePlanAgentExecutor(AgentExecutor):
    def __init__(self):
        self.agent = CarePlanAgent()

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        result = await self.agent.invoke(context.message)
        await event_queue.enqueue_event(new_agent_text_message(result))

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise Exception("cancel not supported")


def main():
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Warning: OPENAI_API_KEY environment variable not set!")
        print("   Set it with: export OPENAI_API_KEY='your-key-here'")
        print()

    request_handler = DefaultRequestHandler(
        agent_executor=CarePlanAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"🧠 Starting Care Plan Agent (LangGraph + A2A) on http://localhost:{port}")
    uvicorn.run(server.build(), host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
