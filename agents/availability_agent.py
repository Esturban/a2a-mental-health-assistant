"""
Availability Agent (ADK + A2A Protocol)

This agent summarizes therapist schedule openings, including modality options
and telehealth notes. It exposes an A2A Protocol endpoint and can be called by
the orchestrator.
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


class DailyAvailability(BaseModel):
    day: str = Field(description="Day label, e.g. Monday")
    date: str = Field(description="Calendar date")
    slots: List[str] = Field(description="Available times (local) or status notes")
    isVirtual: bool = Field(description="Whether the slot is virtual")


class StructuredAvailability(BaseModel):
    therapistName: str = Field(description="Therapist or team name")
    credentials: str = Field(description="Therapist credentials")
    primaryFocus: str = Field(description="Primary clinical focus")
    modalities: List[str] = Field(description="Modalities offered")
    availability: List[DailyAvailability] = Field(description="Daily availability summary")
    bookingNotes: str = Field(description="Notes for scheduling or logistics")
    telehealthOptions: List[str] = Field(description="Telehealth or access considerations")


class AvailabilityAgent:
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
            name="availability_agent",
            description="Summarizes therapist availability, modalities, and telehealth options",
            instruction="""
You help care coordinators understand therapist availability. When given a request,
consider the client's preferred format, availability, and focus areas. Return ONLY
valid JSON with this structure:

{
  "therapistName": "Therapist or group name",
  "credentials": "Credentials and license",
  "primaryFocus": "Clinical specialties aligned with the request",
  "modalities": ["CBT", "EMDR", "Somatic"],
  "availability": [
    {
      "day": "Monday",
      "date": "2025-01-20",
      "slots": ["6:00pm", "7:30pm"],
      "isVirtual": true
    }
  ],
  "bookingNotes": "How to schedule, waitlist info, or office notes",
  "telehealthOptions": ["Secure video via Jane", "Hybrid first session recommended"]
}

- If there are no openings on a day, return an empty slots array with a helpful note.
- Include at least 4 days of information.
- Ground recommendations in realistic clinical schedules and respect the user's
  preferences (evening/weekend, virtual vs in-person).
- Mention licensing regions or care team details when helpful.
Return ONLY JSON, no markdown.
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
            StructuredAvailability(**data)
            return json.dumps(data, indent=2)
        except Exception as exc:
            return json.dumps({
                "error": "Failed to create availability summary",
                "details": str(exc),
                "raw": text,
            })


port = int(os.getenv("AVAILABILITY_PORT", 9005))

skill = AgentSkill(
    id="availability_agent",
    name="Therapist Availability Agent",
    description="Summarizes therapist schedules with modality context",
    tags=["availability", "therapy", "scheduling"],
    examples=[
        "Find evening telehealth slots for an anxiety client",
        "Summarize EMDR therapist openings in Seattle",
    ],
)

public_agent_card = AgentCard(
    name="Availability Agent",
    description="Provides therapist availability and telehealth guidance.",
    url=f"http://localhost:{port}/",
    version="1.0.0",
    defaultInputModes=["text"],
    defaultOutputModes=["text"],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)


class AvailabilityAgentExecutor(AgentExecutor):
    def __init__(self):
        self.agent = AvailabilityAgent()

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
        agent_executor=AvailabilityAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"📅 Starting Availability Agent (ADK + A2A) on http://localhost:{port}")
    uvicorn.run(server.build(), host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
