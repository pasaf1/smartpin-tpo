"""
MCP Client for connecting to SmartPin Supabase MCP Server
"""

import json
import asyncio
import subprocess
from typing import Dict, Any, Optional

class MCPClient:
    """Client for communicating with MCP servers"""
    
    def __init__(self):
        self.mcp_server_path = "../mcp-servers/smartpin-supabase/dist/index.js"
        self.process = None
        self.connected = False
    
    async def connect(self):
        """Connect to MCP server"""
        try:
            self.process = await asyncio.create_subprocess_exec(
                "node", self.mcp_server_path,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            self.connected = True
            return True
        except Exception as e:
            print(f"Failed to connect to MCP server: {e}")
            return False
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool on the MCP server"""
        if not self.connected:
            await self.connect()
        
        if not self.process:
            raise Exception("MCP server not connected")
        
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        try:
            # Send request
            request_data = json.dumps(request) + "\n"
            self.process.stdin.write(request_data.encode())
            await self.process.stdin.drain()
            
            # Read response
            response_line = await self.process.stdout.readline()
            response_data = json.loads(response_line.decode().strip())
            
            if "error" in response_data:
                raise Exception(f"MCP server error: {response_data['error']}")
            
            return response_data.get("result", {})
            
        except Exception as e:
            raise Exception(f"MCP call failed: {e}")
    
    async def list_tools(self) -> Dict[str, Any]:
        """List available tools"""
        if not self.connected:
            await self.connect()
        
        request = {
            "jsonrpc": "2.0", 
            "id": 1,
            "method": "tools/list"
        }
        
        try:
            request_data = json.dumps(request) + "\n"
            self.process.stdin.write(request_data.encode())
            await self.process.stdin.drain()
            
            response_line = await self.process.stdout.readline()
            response_data = json.loads(response_line.decode().strip())
            
            return response_data.get("result", {})
            
        except Exception as e:
            print(f"Failed to list tools: {e}")
            return {"tools": []}
    
    async def disconnect(self):
        """Disconnect from MCP server"""
        if self.process:
            self.process.terminate()
            await self.process.wait()
            self.connected = False