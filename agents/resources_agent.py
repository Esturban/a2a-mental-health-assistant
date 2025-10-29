"""
Resources Agent (ADK + A2A Protocol)

Curates supportive resources, self-guided practices, and crisis contacts aligned
with the client's focus areas. Exposes an A2A Protocol endpoint.
"""

import uvicorn
import os
import json
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field, HttpUrl

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


class ResourceItem(BaseModel):
    title: str = Field(description="Resource name")
    type: str = Field(description="Resource category such as article, meditation, hotline")
    url: HttpUrl = Field(description="Link to the resource")
    description: str = Field(description="Short description of how it helps")
    format: str = Field(description="Delivery format, e.g. video, workbook, hotline")


class ResourceCategory(BaseModel):
    focusArea: str = Field(description="Topic or goal served")
    description: str = Field(description="Why these resources matter")
    resources: List[ResourceItem] = Field(description="List of recommended resources")


class StructuredResources(BaseModel):
    overview: str = Field(description="High-level summary of the support set")
    categories: List[ResourceCategory] = Field(description="Resource groupings")


class ResourcesAgent:
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
            name="resources_agent",
            description="Curates therapeutic resources aligned with client goals",
            instruction="""
You provide trauma-informed, inclusive recommendations for therapists to share
with clients. When given a request, produce ONLY JSON with this structure:
{
  "overview": "Summary",
  "categories": [
    {
      "focusArea": "Sleep hygiene",
      "description": "Why this matters for the client",
      "resources": [
        {
          "title": "Resource name",
          "type": "Meditation",
          "url": "https://...",
          "description": "How it supports the client",
          "format": "Audio"
        }
      ]
    }
  ]
}

Guidelines:
- Tailor the focus areas to the client's concerns and goals.
- Include crisis support or culturally-responsive options when appropriate.
- Prefer reputable sources (therapy organizations, evidence-based apps, helplines).
- Provide at least three categories and 2-3 resources per category.
- Use HTTPS URLs. If a resource is a hotline, include a tel: or text link format.
Return ONLY valid JSON.
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
            StructuredResources(**data)
            return json.dumps(data, indent=2)
        except Exception as exc:
            return json.dumps({
                "error": "Failed to compile resources",
                "details": str(exc),
                "raw": text,
            })


port = int(os.getenv("RESOURCES_PORT", 9003))

skill = AgentSkill(
    id="resources_agent",
    name="Support Resources Agent",
    description="Provides supportive practices, readings, and crisis contacts",
    tags=["resources", "therapy", "support"],
    examples=[
        "Share grounding practices and crisis lines for PTSD",
        "Offer CBT workbooks and journaling prompts for anxiety",
    ],
)

public_agent_card = AgentCard(
    name="Resources Agent",
    description="Curates aligned resources for between-session support.",
    url=f"http://localhost:{port}/",
    version="1.0.0",
    defaultInputModes=["text"],
    defaultOutputModes=["text"],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)


class ResourcesAgentExecutor(AgentExecutor):
    def __init__(self):
        self.agent = ResourcesAgent()

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
        agent_executor=ResourcesAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"📚 Starting Resources Agent (ADK + A2A) on http://localhost:{port}")
    uvicorn.run(server.build(), host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
