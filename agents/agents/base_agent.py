"""
Base agent class for SmartPin TPO agents
"""

import json
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI

class BaseAgent(ABC):
    """Base class for all SmartPin TPO agents"""
    
    def __init__(self, mcp_client, agent_name: str, system_prompt: str):
        self.mcp_client = mcp_client
        self.agent_name = agent_name
        self.system_prompt = system_prompt
        self.llm = ChatOpenAI(
            model="gpt-4o-mini", 
            temperature=0.1
        )
        
    @abstractmethod
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process the agent's task. Must be implemented by subclasses."""
        pass
    
    async def _call_llm(self, messages: List[Any], tools: List[str] = None) -> str:
        """Call LLM with messages and optional tools"""
        try:
            system_msg = SystemMessage(content=self.system_prompt)
            all_messages = [system_msg] + messages
            
            response = await self.llm.ainvoke(all_messages)
            return response.content
        except Exception as e:
            return f"Error calling LLM: {str(e)}"
    
    async def _call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call MCP tool with error handling"""
        try:
            result = await self.mcp_client.call_tool(tool_name, arguments)
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _extract_json_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from text response"""
        try:
            # Look for JSON blocks
            if "```json" in text:
                start = text.find("```json") + 7
                end = text.find("```", start)
                if end != -1:
                    return json.loads(text[start:end].strip())
            
            # Try to parse the whole text as JSON
            return json.loads(text)
        except:
            return None
    
    def _create_response_message(self, content: str) -> AIMessage:
        """Create AI message with agent identification"""
        return AIMessage(
            content=f"[{self.agent_name}] {content}",
            additional_kwargs={"agent": self.agent_name, "timestamp": datetime.now().isoformat()}
        )
    
    def _log_action(self, action: str, details: Dict[str, Any] = None):
        """Log agent actions for debugging"""
        log_entry = {
            "agent": self.agent_name,
            "action": action,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        print(f"[{self.agent_name}] {action}: {json.dumps(details, indent=2) if details else ''}")
        
    async def _validate_inputs(self, state: Dict[str, Any], required_fields: List[str]) -> Optional[str]:
        """Validate required inputs are present in state"""
        missing = []
        for field in required_fields:
            if field not in state or state[field] is None:
                missing.append(field)
        
        if missing:
            return f"Missing required fields: {', '.join(missing)}"
        return None