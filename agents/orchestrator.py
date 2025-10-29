"""
Care Coordination Orchestrator (ADK + AG-UI Protocol)

This agent receives therapist-facing requests via the AG-UI Protocol and
delegates tasks to specialized mental health agents. It acts as the
coordinator for intake collection, care planning, therapist availability,
resource curation, and cost transparency.

Key Components:
- Google ADK (Agent Development Kit) for LLM integration
- AG-UI Protocol for frontend communication
- A2A Protocol for inter-agent coordination via middleware
- FastAPI web server for HTTP endpoints
- Centralized orchestration logic for care coordination workflows

Architecture:
- Leads the booking assistant experience end-to-end
- Routes information between LangGraph and ADK agents
- Honors human-in-the-loop approvals for cost conversations
- Synthesizes agent responses into therapist-ready summaries
"""

# Enable future annotations for forward compatibility
from __future__ import annotations

# Load environment variables from .env file before other imports
from dotenv import load_dotenv
load_dotenv()

# Import necessary libraries for web server and environment variables
import os
import uvicorn

# Import FastAPI for creating HTTP endpoints
from fastapi import FastAPI

# Import AG-UI ADK components for frontend integration
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

# Import Google ADK components for LLM agent creation
from google.adk.agents import LlmAgent


# === ORCHESTRATOR AGENT CONFIGURATION ===
# Create the main orchestrator agent using Google ADK's LlmAgent
# This agent coordinates all travel planning activities and manages the workflow

orchestrator_agent = LlmAgent(
    name="CareCoordinatorAgent",
    model="gemini-2.5-pro",  # Use the more powerful Pro model for complex orchestration
    instruction="""
    You are a mental health care coordination orchestrator. Your role is to support
    therapists by coordinating four specialized agents to produce a booking-ready
    plan.

    AVAILABLE SPECIALIZED AGENTS:

    1. **Care Plan Agent** (LangGraph) - Designs a multi-week therapy roadmap with
       session goals, modalities, and between-session support.
    2. **Availability Agent** (ADK) - Summarizes therapist openings, modality options,
       and telehealth considerations.
    3. **Resources Agent** (ADK) - Curates supportive practices, crisis contacts, and
       educational materials aligned to the client's focus areas.
    4. **Insurance Agent** (ADK) - Estimates monthly costs, coverage assumptions, and
       payment considerations.

    CRITICAL CONSTRAINTS:
    - Call tools and agents ONE AT A TIME and wait for each response.
    - Never make parallel tool calls.
    - Use information already collected instead of re-calling agents unnecessarily.

    RECOMMENDED WORKFLOW:

    0. **FIRST STEP – Collect Intake Snapshot**
       - Immediately call 'collect_client_intake'. Extract any available details from
         the user message to pre-fill the form (client name, primary concern,
         therapy goals, preferred format, availability, insurance, safety notes).
       - Wait for the user to submit the intake information before calling any agents.

    1. **Care Plan Agent** – Create the therapeutic roadmap
       - Provide a clear summary of the intake details and ask for a structured plan.

    2. **Availability Agent** – Surface therapist openings
       - Share the client's scheduling and modality preferences so the agent can return
         a weekly availability view.

    3. **Resources Agent** – Gather supportive materials
       - Request resources aligned with the client's goals and coping needs.

    4. **Insurance Agent** – Produce the cost estimate
       - Pass along format preferences, expected cadence, and any insurance/payment
         context from intake.
       - After receiving the estimate, you MUST call 'request_cost_confirmation' to
         pause for human approval.

    RESPONSE STRATEGY:
    - Acknowledge each agent response and explain how it informs the care plan.
    - Synthesize the final answer so the therapist can act immediately.
    - Highlight safety considerations and next steps where relevant.
    """,
)

# === AG-UI PROTOCOL INTEGRATION ===
# Wrap the orchestrator agent with AG-UI Protocol capabilities
# This enables frontend communication and provides the interface for user interactions

adk_orchestrator_agent = ADKAgent(
    adk_agent=orchestrator_agent,          # The core LLM agent we created above
    app_name="orchestrator_app",           # Unique application identifier
    user_id="demo_user",                   # Default user ID for demo purposes
    session_timeout_seconds=3600,          # Session timeout (1 hour)
    use_in_memory_services=True            # Use in-memory storage for simplicity
)

# === FASTAPI WEB APPLICATION SETUP ===
# Create the FastAPI application that will serve the orchestrator agent
# This provides HTTP endpoints for the AG-UI Protocol communication

app = FastAPI(title="Mental Health Care Coordinator (ADK)")

# Add the ADK agent endpoint to the FastAPI application
# This creates the necessary routes for AG-UI Protocol communication
add_adk_fastapi_endpoint(app, adk_orchestrator_agent, path="/")

# === MAIN APPLICATION ENTRY POINT ===
if __name__ == "__main__":
    """
    Main entry point when the script is run directly.
    
    This function:
    1. Checks for required environment variables (API keys)
    2. Configures the server port
    3. Starts the uvicorn server with the FastAPI application
    """
    
    # Check for required Google API key
    if not os.getenv("GOOGLE_API_KEY"):
        print("⚠️  Warning: GOOGLE_API_KEY environment variable not set!")
        print("   Set it with: export GOOGLE_API_KEY='your-key-here'")
        print("   Get a key from: https://aistudio.google.com/app/apikey")
        print()

    # Get server port from environment variable, default to 9000
    port = int(os.getenv("ORCHESTRATOR_PORT", 9000))
    
    # Start the server with detailed information
    print(f"🚀 Starting Orchestrator Agent (ADK + AG-UI) on http://localhost:{port}")
    
    # Run the FastAPI application using uvicorn
    # host="0.0.0.0" allows external connections
    # port is configurable via environment variable
    uvicorn.run(app, host="0.0.0.0", port=port)
