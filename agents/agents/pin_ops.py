"""
Pin Operations Agent - Handles pin creation, updates, and management
"""

import json
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage

from .base_agent import BaseAgent

class PinOpsAgent(BaseAgent):
    """Agent specializing in pin operations and management"""
    
    def __init__(self, mcp_client):
        system_prompt = """You are a Pin Operations Specialist for construction quality control.

Your responsibilities:
- Create new pins with proper validation
- Update existing pins and their properties  
- Manage pin hierarchies (parent-child relationships)
- Handle pin status transitions
- Coordinate with spatial validation systems

When creating pins:
1. Validate coordinates are within roof boundaries
2. Check for nearby pins to avoid clustering
3. Assign appropriate sequence numbers
4. Set initial status and severity levels
5. Create audit log entries

Available MCP tools:
- create_pin: Create new pin with spatial validation
- update_pin_status: Update pin status 
- create_pin_child: Create child issue for existing pin
- find_nearby_pins: Find pins within radius
- search_pins: Search pins with filters

Always respond with JSON format:
{
  "action": "action_taken", 
  "success": boolean,
  "results": {},
  "next_steps": ["step1", "step2"],
  "recommendations": []
}"""

        super().__init__(mcp_client, "PinOps", system_prompt)
    
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process pin operations tasks"""
        
        self._log_action("Processing pin operations task", {"state_keys": list(state.keys())})
        
        # Extract task from messages
        last_message = state["messages"][-1] if state["messages"] else None
        if not last_message:
            return {
                **state,
                "error_state": "No task message provided",
                "next_agent": "end"
            }
        
        task_content = last_message.content
        
        # Analyze what type of pin operation is needed
        operation_analysis = await self._analyze_pin_operation(task_content, state)
        
        if not operation_analysis:
            return {
                **state,
                "error_state": "Could not analyze pin operation",
                "next_agent": "end"
            }
        
        # Execute the appropriate operation
        result = await self._execute_operation(operation_analysis, state)
        
        # Create response message
        response_message = self._create_response_message(
            f"Pin operation completed: {result.get('action', 'unknown')}. "
            f"Success: {result.get('success', False)}"
        )
        
        return {
            **state,
            "messages": [response_message],
            "results": {**state.get("results", {}), "pin_ops": result},
            "next_agent": "end" if result.get("success", False) else "error"
        }
    
    async def _analyze_pin_operation(self, task: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze task to determine pin operation type"""
        
        analysis_prompt = f"""
        Analyze this pin operation task:
        
        Task: {task}
        Available context: {json.dumps(state.get('context', {}), indent=2)}
        
        Determine:
        1. Operation type (create, update, search, etc.)
        2. Required parameters
        3. Validation needed
        
        Operations available:
        - create_pin: Create new pin (needs roof_id, x, y coordinates)
        - update_pin_status: Change pin status (needs pin_id, new_status)
        - create_pin_child: Add child issue (needs pin_id, child details)
        - search_pins: Find pins with filters
        - find_nearby_pins: Proximity search
        
        Respond with JSON:
        {{
            "operation": "operation_name",
            "parameters": {{}},
            "validation_required": ["check1", "check2"],
            "confidence": 0.95
        }}
        """
        
        response = await self._call_llm([HumanMessage(content=analysis_prompt)])
        return self._extract_json_from_text(response)
    
    async def _execute_operation(self, operation: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the determined pin operation"""
        
        op_type = operation.get("operation")
        params = operation.get("parameters", {})
        
        self._log_action(f"Executing operation: {op_type}", params)
        
        if op_type == "create_pin":
            return await self._create_pin(params, state)
        elif op_type == "update_pin_status":
            return await self._update_pin_status(params)
        elif op_type == "create_pin_child":
            return await self._create_pin_child(params)
        elif op_type == "search_pins":
            return await self._search_pins(params)
        elif op_type == "find_nearby_pins":
            return await self._find_nearby_pins(params)
        else:
            return {
                "action": "unknown_operation",
                "success": False,
                "error": f"Unknown operation: {op_type}"
            }
    
    async def _create_pin(self, params: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new pin with validation"""
        
        # Validate required parameters
        required = ["roof_id", "x", "y"]
        validation_error = await self._validate_inputs({**params, **state}, required)
        if validation_error:
            return {
                "action": "create_pin",
                "success": False,
                "error": validation_error
            }
        
        # Check for nearby pins first
        nearby_result = await self._call_mcp_tool("find_nearby_pins", {
            "roof_id": params["roof_id"],
            "x": params["x"],
            "y": params["y"],
            "radius_meters": 5  # 5 meter radius check
        })
        
        nearby_pins = []
        if nearby_result["success"]:
            nearby_pins = nearby_result.get("data", [])
        
        # Create the pin
        create_result = await self._call_mcp_tool("create_pin", params)
        
        if not create_result["success"]:
            return {
                "action": "create_pin",
                "success": False,
                "error": create_result.get("error"),
                "nearby_pins": len(nearby_pins)
            }
        
        return {
            "action": "create_pin", 
            "success": True,
            "results": create_result["data"],
            "nearby_pins": len(nearby_pins),
            "recommendations": self._generate_pin_recommendations(nearby_pins),
            "next_steps": ["upload_opening_photo", "assign_inspector"]
        }
    
    async def _update_pin_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Update pin status"""
        
        result = await self._call_mcp_tool("update_pin_status", params)
        
        if not result["success"]:
            return {
                "action": "update_pin_status",
                "success": False,
                "error": result.get("error")
            }
        
        # Generate next steps based on new status
        next_steps = []
        if params.get("status") == "ReadyForInspection":
            next_steps = ["schedule_inspection", "notify_qa_manager"]
        elif params.get("status") == "Closed":
            next_steps = ["update_reports", "notify_stakeholders"]
        
        return {
            "action": "update_pin_status",
            "success": True, 
            "results": result["data"],
            "next_steps": next_steps
        }
    
    async def _create_pin_child(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create child issue for existing pin"""
        
        result = await self._call_mcp_tool("create_pin_child", params)
        
        return {
            "action": "create_pin_child",
            "success": result["success"],
            "results": result.get("data"),
            "error": result.get("error"),
            "next_steps": ["assign_child_priority", "set_due_date"] if result["success"] else []
        }
    
    async def _search_pins(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search pins with filters"""
        
        result = await self._call_mcp_tool("search_pins", params)
        
        if result["success"]:
            pins = result.get("data", [])
            return {
                "action": "search_pins",
                "success": True,
                "results": {
                    "pins": pins,
                    "count": len(pins),
                    "filters_applied": params
                }
            }
        else:
            return {
                "action": "search_pins", 
                "success": False,
                "error": result.get("error")
            }
    
    async def _find_nearby_pins(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Find nearby pins for spatial analysis"""
        
        result = await self._call_mcp_tool("find_nearby_pins", params)
        
        if result["success"]:
            nearby = result.get("data", [])
            return {
                "action": "find_nearby_pins",
                "success": True,
                "results": {
                    "nearby_pins": nearby,
                    "count": len(nearby),
                    "search_radius": params.get("radius_meters", 10)
                },
                "recommendations": self._generate_proximity_recommendations(nearby)
            }
        else:
            return {
                "action": "find_nearby_pins",
                "success": False, 
                "error": result.get("error")
            }
    
    def _generate_pin_recommendations(self, nearby_pins: List[Dict]) -> List[str]:
        """Generate recommendations based on nearby pins"""
        recommendations = []
        
        if len(nearby_pins) > 3:
            recommendations.append("High pin density detected - consider consolidating related issues")
        
        if nearby_pins:
            statuses = [pin.get("status", "Unknown") for pin in nearby_pins]
            if "Open" in statuses:
                recommendations.append("Open pins nearby - coordinate resolution efforts")
        
        return recommendations
    
    def _generate_proximity_recommendations(self, nearby_pins: List[Dict]) -> List[str]:
        """Generate recommendations based on proximity analysis"""
        recommendations = []
        
        if len(nearby_pins) == 0:
            recommendations.append("No nearby pins - isolated issue")
        elif len(nearby_pins) > 5:
            recommendations.append("High concentration area - may indicate systemic issue")
            recommendations.append("Consider pattern analysis and root cause investigation")
        
        return recommendations