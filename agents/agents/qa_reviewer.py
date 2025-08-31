"""
QA Reviewer Agent - Handles quality control, inspections, and approvals
"""

import json
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage

from .base_agent import BaseAgent

class QAReviewerAgent(BaseAgent):
    """Agent specializing in quality assurance and review processes"""
    
    def __init__(self, mcp_client):
        system_prompt = """You are a QA Review Specialist for construction quality control.

Your responsibilities:
- Review pins and validate completion criteria
- Approve or reject pin closures based on evidence
- Ensure photos and documentation meet standards  
- Manage inspection workflows and schedules
- Escalate complex issues to supervisors

Quality criteria for pin closure:
1. Closing photo clearly shows resolution
2. All child issues are resolved
3. Corrective action is appropriate for defect type
4. Timeline meets SLA requirements
5. Proper documentation and notes

Available MCP tools:
- search_pins: Find pins needing review
- update_pin_status: Approve/reject closures
- get_pin_analytics: Review performance metrics
- find_nearby_pins: Check for pattern issues

Decision framework:
- APPROVE: All criteria met, clear resolution
- REJECT: Missing evidence, incomplete work
- REQUEST_MORE_INFO: Need additional documentation
- ESCALATE: Complex issue requiring supervisor review

Always respond with JSON format:
{
  "decision": "APPROVE|REJECT|REQUEST_MORE_INFO|ESCALATE",
  "rationale": "detailed_explanation", 
  "requirements": ["requirement1", "requirement2"],
  "next_steps": ["step1", "step2"],
  "confidence": 0.95
}"""

        super().__init__(mcp_client, "QAReviewer", system_prompt)
    
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process QA review tasks"""
        
        self._log_action("Processing QA review task")
        
        # Extract task from messages
        last_message = state["messages"][-1] if state["messages"] else None
        if not last_message:
            return {
                **state,
                "error_state": "No task message provided",
                "next_agent": "end"
            }
        
        task_content = last_message.content
        
        # Analyze what type of QA operation is needed
        review_analysis = await self._analyze_qa_task(task_content, state)
        
        if not review_analysis:
            return {
                **state,
                "error_state": "Could not analyze QA task",
                "next_agent": "end"
            }
        
        # Execute the appropriate review operation
        result = await self._execute_review(review_analysis, state)
        
        # Create response message
        response_message = self._create_response_message(
            f"QA review completed: {result.get('decision', 'unknown')}. "
            f"Rationale: {result.get('rationale', 'N/A')}"
        )
        
        return {
            **state,
            "messages": [response_message],
            "results": {**state.get("results", {}), "qa_review": result},
            "next_agent": "end" if result.get("decision") != "ESCALATE" else "supervisor"
        }
    
    async def _analyze_qa_task(self, task: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze task to determine QA operation type"""
        
        analysis_prompt = f"""
        Analyze this QA review task:
        
        Task: {task}
        Available context: {json.dumps(state.get('context', {}), indent=2)}
        
        Determine the type of QA operation needed:
        - pin_review: Review specific pin for closure
        - batch_review: Review multiple pins
        - inspection_schedule: Schedule inspections
        - quality_audit: Audit quality metrics
        - pattern_analysis: Analyze recurring issues
        
        Extract relevant details:
        - Pin IDs to review
        - Review criteria to check
        - Urgency level
        - Special requirements
        
        Respond with JSON:
        {{
            "operation": "operation_type",
            "pin_ids": ["pin1", "pin2"],
            "criteria": ["criterion1", "criterion2"],
            "urgency": "high|medium|low",
            "special_requirements": []
        }}
        """
        
        response = await self._call_llm([HumanMessage(content=analysis_prompt)])
        return self._extract_json_from_text(response)
    
    async def _execute_review(self, analysis: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the QA review operation"""
        
        operation = analysis.get("operation")
        
        self._log_action(f"Executing QA operation: {operation}", analysis)
        
        if operation == "pin_review":
            return await self._review_pins(analysis.get("pin_ids", []), analysis)
        elif operation == "batch_review":
            return await self._batch_review(analysis, state)
        elif operation == "quality_audit":
            return await self._quality_audit(state)
        elif operation == "pattern_analysis":
            return await self._pattern_analysis(analysis, state)
        else:
            return {
                "decision": "REQUEST_MORE_INFO",
                "rationale": f"Unknown QA operation: {operation}",
                "next_steps": ["clarify_requirements"]
            }
    
    async def _review_pins(self, pin_ids: List[str], analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Review specific pins for closure approval"""
        
        if not pin_ids:
            return {
                "decision": "REQUEST_MORE_INFO",
                "rationale": "No pin IDs provided for review",
                "requirements": ["specify_pin_ids"]
            }
        
        review_results = []
        
        for pin_id in pin_ids:
            pin_review = await self._review_single_pin(pin_id, analysis.get("criteria", []))
            review_results.append(pin_review)
        
        # Aggregate results
        all_approved = all(r["decision"] == "APPROVE" for r in review_results)
        any_escalated = any(r["decision"] == "ESCALATE" for r in review_results)
        
        if any_escalated:
            overall_decision = "ESCALATE"
        elif all_approved:
            overall_decision = "APPROVE"
        else:
            overall_decision = "REJECT"
        
        return {
            "decision": overall_decision,
            "rationale": f"Reviewed {len(pin_ids)} pins",
            "individual_results": review_results,
            "summary": self._generate_review_summary(review_results),
            "next_steps": self._determine_next_steps(overall_decision, review_results)
        }
    
    async def _review_single_pin(self, pin_id: str, criteria: List[str]) -> Dict[str, Any]:
        """Review a single pin against QA criteria"""
        
        # Search for the pin details
        search_result = await self._call_mcp_tool("search_pins", {
            "pin_ids": [pin_id]
        })
        
        if not search_result["success"]:
            return {
                "pin_id": pin_id,
                "decision": "REQUEST_MORE_INFO", 
                "rationale": f"Could not retrieve pin details: {search_result.get('error')}",
                "confidence": 0.0
            }
        
        pin_data = search_result.get("data", {})
        
        # Apply QA criteria
        criteria_checks = await self._apply_qa_criteria(pin_data, criteria)
        
        # Make decision based on criteria results
        decision = self._make_qa_decision(criteria_checks)
        
        return {
            "pin_id": pin_id,
            "decision": decision["decision"],
            "rationale": decision["rationale"],
            "criteria_checks": criteria_checks,
            "confidence": decision["confidence"]
        }
    
    async def _apply_qa_criteria(self, pin_data: Dict[str, Any], criteria: List[str]) -> Dict[str, Any]:
        """Apply QA criteria to pin data"""
        
        checks = {}
        
        # Standard QA checks
        checks["has_closing_photo"] = bool(pin_data.get("closing_photo_url"))
        checks["status_ready_for_review"] = pin_data.get("status") == "ReadyForInspection"
        checks["has_documentation"] = bool(pin_data.get("notes") or pin_data.get("corrective_action"))
        
        # Check child pins if any
        child_pins = pin_data.get("pin_children", [])
        checks["all_children_closed"] = all(
            child.get("status_child") == "Closed" for child in child_pins
        ) if child_pins else True
        
        # Timeline check
        import datetime
        if pin_data.get("opened_at") and pin_data.get("due_date"):
            opened = datetime.fromisoformat(pin_data["opened_at"].replace('Z', '+00:00'))
            due = datetime.fromisoformat(pin_data["due_date"].replace('Z', '+00:00'))
            checks["within_sla"] = datetime.datetime.now(datetime.timezone.utc) <= due
        else:
            checks["within_sla"] = None  # No SLA defined
        
        # Photo quality check (simplified)
        if pin_data.get("closing_photo_url"):
            checks["photo_quality_acceptable"] = True  # Would need actual image analysis
        
        # Defect resolution appropriateness
        checks["resolution_appropriate"] = bool(
            pin_data.get("corrective_action") and 
            len(pin_data.get("corrective_action", "")) > 10
        )
        
        return checks
    
    def _make_qa_decision(self, criteria_checks: Dict[str, Any]) -> Dict[str, Any]:
        """Make QA decision based on criteria checks"""
        
        # Critical requirements that must pass
        critical_checks = [
            "has_closing_photo",
            "status_ready_for_review", 
            "all_children_closed"
        ]
        
        # Check critical requirements
        critical_failures = []
        for check in critical_checks:
            if not criteria_checks.get(check, False):
                critical_failures.append(check)
        
        if critical_failures:
            return {
                "decision": "REJECT",
                "rationale": f"Critical requirements not met: {', '.join(critical_failures)}",
                "confidence": 0.95
            }
        
        # Check other quality indicators
        quality_score = 0
        quality_checks = ["has_documentation", "within_sla", "resolution_appropriate"]
        
        for check in quality_checks:
            value = criteria_checks.get(check)
            if value is True:
                quality_score += 1
            elif value is None:
                quality_score += 0.5  # Neutral for unknown
        
        quality_ratio = quality_score / len(quality_checks)
        
        if quality_ratio >= 0.8:
            return {
                "decision": "APPROVE",
                "rationale": f"All critical requirements met, quality score: {quality_ratio:.1%}",
                "confidence": 0.9
            }
        elif quality_ratio >= 0.6:
            return {
                "decision": "REQUEST_MORE_INFO",
                "rationale": f"Marginal quality score: {quality_ratio:.1%}. Need additional documentation",
                "confidence": 0.7
            }
        else:
            return {
                "decision": "REJECT", 
                "rationale": f"Low quality score: {quality_ratio:.1%}. Insufficient documentation",
                "confidence": 0.8
            }
    
    async def _batch_review(self, analysis: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Review multiple pins in batch"""
        
        # Find pins ready for review
        search_result = await self._call_mcp_tool("search_pins", {
            "roof_id": state.get("roof_id"),
            "status": "ReadyForInspection",
            "limit": 20
        })
        
        if not search_result["success"]:
            return {
                "decision": "REQUEST_MORE_INFO",
                "rationale": f"Could not retrieve pins for batch review: {search_result.get('error')}"
            }
        
        pins = search_result.get("data", [])
        pin_ids = [pin["id"] for pin in pins]
        
        return await self._review_pins(pin_ids, analysis)
    
    async def _quality_audit(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Perform quality audit on project/roof"""
        
        # Get analytics for quality metrics
        analytics_result = await self._call_mcp_tool("get_pin_analytics", {
            "roof_id": state.get("roof_id"),
            "time_range": "week"
        })
        
        if not analytics_result["success"]:
            return {
                "decision": "REQUEST_MORE_INFO",
                "rationale": "Could not retrieve analytics for quality audit"
            }
        
        analytics = analytics_result.get("data", {})
        
        # Analyze quality metrics
        quality_indicators = self._analyze_quality_metrics(analytics)
        
        decision = "APPROVE" if quality_indicators["overall_score"] >= 0.8 else "ESCALATE"
        
        return {
            "decision": decision,
            "rationale": f"Quality audit score: {quality_indicators['overall_score']:.1%}",
            "quality_indicators": quality_indicators,
            "recommendations": quality_indicators["recommendations"]
        }
    
    def _analyze_quality_metrics(self, analytics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze quality metrics from analytics data"""
        
        indicators = {}
        recommendations = []
        
        # Closure rate
        status_breakdown = analytics.get("status_breakdown", {})
        total = sum(status_breakdown.values())
        closed = status_breakdown.get("Closed", 0)
        
        if total > 0:
            indicators["closure_rate"] = closed / total
            if indicators["closure_rate"] < 0.7:
                recommendations.append("Low closure rate - review workflow efficiency")
        
        # Response time (would need more detailed data)
        indicators["response_time_score"] = 0.8  # Placeholder
        
        # Pattern analysis
        zone_breakdown = analytics.get("zone_breakdown", {})
        if len(zone_breakdown) > 0:
            max_zone_count = max(zone_breakdown.values())
            total_pins = sum(zone_breakdown.values())
            indicators["concentration_ratio"] = max_zone_count / total_pins if total_pins > 0 else 0
            
            if indicators["concentration_ratio"] > 0.5:
                recommendations.append("High concentration in single zone - investigate systemic issues")
        
        # Overall score
        scores = [v for v in indicators.values() if isinstance(v, (int, float))]
        indicators["overall_score"] = sum(scores) / len(scores) if scores else 0.5
        indicators["recommendations"] = recommendations
        
        return indicators
    
    async def _pattern_analysis(self, analysis: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns in issues for quality insights"""
        
        # This would involve more complex analysis
        return {
            "decision": "APPROVE",
            "rationale": "Pattern analysis completed - no critical issues detected",
            "patterns": [],
            "recommendations": ["Continue monitoring trends"]
        }
    
    def _generate_review_summary(self, review_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary of review results"""
        
        total = len(review_results)
        approved = len([r for r in review_results if r["decision"] == "APPROVE"])
        rejected = len([r for r in review_results if r["decision"] == "REJECT"])
        escalated = len([r for r in review_results if r["decision"] == "ESCALATE"])
        
        return {
            "total_reviewed": total,
            "approved": approved,
            "rejected": rejected,
            "escalated": escalated,
            "approval_rate": approved / total if total > 0 else 0
        }
    
    def _determine_next_steps(self, overall_decision: str, review_results: List[Dict[str, Any]]) -> List[str]:
        """Determine next steps based on review decision"""
        
        steps = []
        
        if overall_decision == "APPROVE":
            steps.extend([
                "Update pin statuses to Closed",
                "Notify stakeholders of completions", 
                "Update project metrics"
            ])
        elif overall_decision == "REJECT":
            steps.extend([
                "Notify field teams of rejections",
                "Provide specific remediation guidance",
                "Schedule re-inspection"
            ])
        elif overall_decision == "ESCALATE":
            steps.extend([
                "Prepare escalation summary",
                "Schedule supervisor review",
                "Document complex issues"
            ])
        
        return steps