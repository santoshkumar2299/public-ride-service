#!/bin/bash

# 🤖 MULTI-AGENT STARTUP SCRIPT
# Automatically starts all specialized agents with their context files
# Run this script when terminal crashes or project context is needed

echo "🚀 Starting Multi-Agent System for Public Ride Service..."

# Check if AGENT_CONTEXTS directory exists
if [ ! -d "AGENT_CONTEXTS" ]; then
    echo "❌ AGENT_CONTEXTS directory not found. Please run from project root."
    exit 1
fi

# Start all agents in parallel with their context files
echo "👤 Starting USER_PROFILE_AGENT..."
claude --agent USER_PROFILE_AGENT --context-file AGENT_CONTEXTS/USER_PROFILE_AGENT.md &

echo "🚌 Starting TRANSPORT_AGENT..."
claude --agent TRANSPORT_AGENT --context-file AGENT_CONTEXTS/TRANSPORT_AGENT.md &

echo "🗺️ Starting MAP_AGENT..."
claude --agent MAP_AGENT --context-file AGENT_CONTEXTS/MAP_AGENT.md &

echo "🚨 Starting EMERGENCY_AGENT..."
claude --agent EMERGENCY_AGENT --context-file AGENT_CONTEXTS/EMERGENCY_AGENT.md &

echo "🤝 Starting COMMUNITY_AGENT..."
claude --agent COMMUNITY_AGENT --context-file AGENT_CONTEXTS/COMMUNITY_AGENT.md &

# Wait for all background processes
wait

echo "✅ All agents started successfully!"
echo "📋 Each agent has loaded its persistent context and is ready to work."
echo "🔄 Context files will be automatically updated after each interaction."