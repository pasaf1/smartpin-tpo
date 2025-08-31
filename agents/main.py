#!/usr/bin/env python3
"""
SmartPin TPO Multi-Agent System
Orchestrates specialized agents for construction QC workflows
"""

import os
import json
import asyncio
from typing import Dict, List, Any, Optional, TypedDict, Annotated
from datetime import datetime
import operator

# LangGraph imports
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

# LangChain imports
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# Local imports
from agents.pin_ops import PinOpsAgent
from agents.qa_reviewer import QAReviewerAgent  
from agents.spatial_analyst import SpatialAnalystAgent
from agents.photo_processor import PhotoProcessorAgent
from agents.reporter import ReporterAgent
from mcp_client import MCPClient

# Load environment
from dotenv import load_dotenv
load_dotenv()

class WorkflowState(TypedDict):
    """Shared state across all agents"""
    messages: Annotated[List, operator.add]
    current_task: str
    project_id: Optional[str] 
    roof_id: Optional[str]
    context: Dict[str, Any]
    results: Dict[str, Any]
    next_agent: str
    error_state: Optional[str]

class SmartPinOrchestrator:
    """Main orchestrator for SmartPin TPO multi-agent system"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1
        )
        
        # Initialize MCP client for Supabase operations
        self.mcp_client = MCPClient()
        
        # Initialize specialized agents
        self.pin_ops_agent = PinOpsAgent(self.mcp_client)
        self.qa_reviewer_agent = QAReviewerAgent(self.mcp_client)
        self.spatial_analyst_agent = SpatialAnalystAgent(self.mcp_client)
        self.photo_processor_agent = PhotoProcessorAgent(self.mcp_client)
        self.reporter_agent = ReporterAgent(self.mcp_client)
        
        # Build workflow graph
        self.workflow = self._build_workflow()
        
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        # Create the main workflow graph
        workflow = StateGraph(WorkflowState)
        
        # Add nodes for each agent
        workflow.add_node("supervisor", self._supervisor_node)
        workflow.add_node("pin_ops", self.pin_ops_agent.process)
        workflow.add_node("qa_reviewer", self.qa_reviewer_agent.process)
        workflow.add_node("spatial_analyst", self.spatial_analyst_agent.process)
        workflow.add_node("photo_processor", self.photo_processor_agent.process)
        workflow.add_node("reporter", self.reporter_agent.process)
        workflow.add_node("error_handler", self._error_handler_node)
        
        # Set entry point
        workflow.set_entry_point("supervisor")
        
        # Add conditional routing from supervisor
        workflow.add_conditional_edges(
            "supervisor",
            self._route_to_agent,
            {
                "pin_ops": "pin_ops",
                "qa_reviewer": "qa_reviewer", 
                "spatial_analyst": "spatial_analyst",
                "photo_processor": "photo_processor",
                "reporter": "reporter",
                "error": "error_handler",
                "end": END
            }
        )
        
        # All agents can go back to supervisor or end
        for agent_name in ["pin_ops", "qa_reviewer", "spatial_analyst", "photo_processor", "reporter"]:
            workflow.add_conditional_edges(
                agent_name,
                self._agent_completion_router,
                {
                    "supervisor": "supervisor",
                    "error": "error_handler",
                    "end": END
                }
            )
            
        # Error handler can retry or end
        workflow.add_conditional_edges(
            "error_handler",
            self._error_recovery_router,
            {
                "supervisor": "supervisor",
                "end": END
            }
        )
        
        return workflow
    
    async def _supervisor_node(self, state: WorkflowState) -> WorkflowState:
        """Supervisor node that routes tasks to appropriate agents"""
        
        last_message = state["messages"][-1] if state["messages"] else None
        
        if not last_message:
            return {
                **state,
                "next_agent": "end",
                "messages": [AIMessage(content="No task provided")]
            }
        
        # Analyze the task and determine routing
        task_analysis = await self._analyze_task(last_message.content)
        
        supervisor_message = AIMessage(
            content=f"Task analyzed: {task_analysis['description']}. Routing to {task_analysis['agent']}."
        )
        
        return {
            **state,
            "messages": [supervisor_message],
            "next_agent": task_analysis['agent'],
            "current_task": task_analysis['description'],
            "context": {**state.get("context", {}), **task_analysis.get("context", {})}
        }
    
    async def _analyze_task(self, task: str) -> Dict[str, Any]:
        """Analyze task content and determine appropriate agent"""
        
        analysis_prompt = f"""
        Analyze this construction QC task and determine which specialist agent should handle it:
        
        Task: {task}
        
        Available agents:
        - pin_ops: Create, update, manage pins and issues
        - qa_reviewer: Review pins, approve closures, quality control  
        - spatial_analyst: Spatial analysis, proximity, region analysis
        - photo_processor: Upload, process, analyze photos
        - reporter: Generate reports, analytics, exports
        
        Respond with JSON format:
        {{
            "agent": "agent_name",
            "description": "brief task description",
            "context": {{"key": "value"}},
            "confidence": 0.95
        }}
        """
        
        response = await self.llm.ainvoke([
            SystemMessage(content="You are a construction QC supervisor. Analyze tasks and route to appropriate specialists."),
            HumanMessage(content=analysis_prompt)
        ])
        
        try:
            return json.loads(response.content)
        except:
            # Fallback routing based on keywords
            task_lower = task.lower()
            
            if any(word in task_lower for word in ["create", "pin", "issue", "defect"]):
                return {"agent": "pin_ops", "description": "Pin management task", "context": {}}
            elif any(word in task_lower for word in ["review", "approve", "close", "inspect"]):
                return {"agent": "qa_reviewer", "description": "QA review task", "context": {}}
            elif any(word in task_lower for word in ["nearby", "spatial", "region", "proximity"]):
                return {"agent": "spatial_analyst", "description": "Spatial analysis task", "context": {}}
            elif any(word in task_lower for word in ["photo", "image", "upload", "picture"]):
                return {"agent": "photo_processor", "description": "Photo processing task", "context": {}}
            elif any(word in task_lower for word in ["report", "export", "analytics", "summary"]):
                return {"agent": "reporter", "description": "Reporting task", "context": {}}
            else:
                return {"agent": "pin_ops", "description": "General task", "context": {}}
    
    def _route_to_agent(self, state: WorkflowState) -> str:
        """Route based on next_agent in state"""
        return state.get("next_agent", "end")
    
    def _agent_completion_router(self, state: WorkflowState) -> str:
        """Route after agent completion"""
        if state.get("error_state"):
            return "error"
        elif state.get("next_agent") == "end":
            return "end"
        else:
            return "supervisor"
    
    def _error_recovery_router(self, state: WorkflowState) -> str:
        """Handle error recovery routing"""
        if state.get("error_state") == "recoverable":
            return "supervisor"
        else:
            return "end"
    
    async def _error_handler_node(self, state: WorkflowState) -> WorkflowState:
        """Handle errors and attempt recovery"""
        error_msg = state.get("error_state", "Unknown error occurred")
        
        error_message = AIMessage(
            content=f"Error encountered: {error_msg}. Attempting recovery..."
        )
        
        # Simple recovery logic - could be more sophisticated
        recovery_state = "recoverable" if "timeout" in error_msg.lower() else "fatal"
        
        return {
            **state,
            "messages": [error_message],
            "error_state": recovery_state,
            "next_agent": "supervisor" if recovery_state == "recoverable" else "end"
        }
    
    async def process_task(self, task: str, project_id: str = None, roof_id: str = None) -> Dict[str, Any]:
        """Process a task through the multi-agent workflow"""
        
        # Initialize state
        initial_state = WorkflowState(
            messages=[HumanMessage(content=task)],
            current_task=task,
            project_id=project_id,
            roof_id=roof_id,
            context={},
            results={},
            next_agent="supervisor",
            error_state=None
        )
        
        # Compile and run workflow
        app = self.workflow.compile(checkpointer=MemorySaver())
        
        final_state = None
        async for event in app.astream(initial_state):
            # Log progress
            if event:
                print(f"Agent: {list(event.keys())[0]}")
                final_state = list(event.values())[0]
        
        return {
            "success": final_state.get("error_state") is None,
            "results": final_state.get("results", {}),
            "messages": [msg.content for msg in final_state.get("messages", [])],
            "final_state": final_state
        }

# FastAPI integration for web interface
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="SmartPin TPO Agents API", version="1.0.0")

class TaskRequest(BaseModel):
    task: str
    project_id: Optional[str] = None
    roof_id: Optional[str] = None
    
class TaskResponse(BaseModel):
    success: bool
    results: Dict[str, Any]
    messages: List[str]
    execution_time: float

# Global orchestrator instance
orchestrator = SmartPinOrchestrator()

@app.post("/process_task", response_model=TaskResponse)
async def process_task_endpoint(request: TaskRequest):
    """Process a task through the multi-agent system"""
    start_time = datetime.now()
    
    try:
        result = await orchestrator.process_task(
            task=request.task,
            project_id=request.project_id,
            roof_id=request.roof_id
        )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return TaskResponse(
            success=result["success"],
            results=result["results"],
            messages=result["messages"],
            execution_time=execution_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/agents")
async def list_agents():
    """List available agents and their capabilities"""
    return {
        "agents": {
            "pin_ops": "Create, update, and manage pins and issues",
            "qa_reviewer": "Review pins, approve closures, quality control",
            "spatial_analyst": "Spatial analysis, proximity detection, region analysis", 
            "photo_processor": "Upload, process, and analyze construction photos",
            "reporter": "Generate reports, analytics, and data exports"
        }
    }

# CLI interface
import argparse

def main():
    parser = argparse.ArgumentParser(description="SmartPin TPO Multi-Agent System")
    parser.add_argument("--mode", choices=["server", "cli"], default="server")
    parser.add_argument("--task", help="Task to process (CLI mode)")
    parser.add_argument("--project-id", help="Project ID")
    parser.add_argument("--roof-id", help="Roof ID")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    
    args = parser.parse_args()
    
    if args.mode == "server":
        import uvicorn
        print(f"Starting SmartPin TPO Agents server on port {args.port}")
        uvicorn.run(app, host="0.0.0.0", port=args.port)
    else:
        if not args.task:
            print("Error: --task is required for CLI mode")
            return
            
        async def run_cli():
            orchestrator = SmartPinOrchestrator()
            result = await orchestrator.process_task(
                task=args.task,
                project_id=args.project_id,
                roof_id=args.roof_id
            )
            
            print(f"Success: {result['success']}")
            print(f"Results: {json.dumps(result['results'], indent=2)}")
            for msg in result['messages']:
                print(f"Message: {msg}")
        
        asyncio.run(run_cli())

if __name__ == "__main__":
    main()