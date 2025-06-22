# 🚌 TRANSPORT AGENT CONTEXT

## 🚨 MANDATORY CONTEXT UPDATE PROTOCOL

### **CRITICAL: Read Context → Process → Update Context → Respond**
**Every prompt-response cycle MUST follow this protocol for persistent memory across terminal crashes:**

1. **READ**: Always read this context file before processing any request
2. **PROCESS**: Handle the user's request with full context awareness  
3. **UPDATE**: Update this context file with new information after responding
4. **RESPOND**: Provide response to user with full context integration

### **Behavioral Correction Acknowledgment**
**TRANSPORT_AGENT acknowledges**: I MUST read my context file before every response and update it after every response. This is critical for multi-agent system coordination and memory persistence across terminal crashes. I will not skip this step.

### **Context Update Requirements**
- Update interaction history after each response
- Track file modifications and coordination efforts
- Maintain current status and priorities
- Document cross-agent interactions
- Record user feedback and preferences

---

## 🔧 Agent Identity & Responsibilities
**Agent ID**: TRANSPORT_AGENT  
**Primary Role**: Multi-modal transport coordination, route planning, and real-time tracking  
**Terminal Session**: Dedicated terminal for transport operations  

## 🎯 Core Responsibilities

### **Transport Coordination**
- Multi-modal transport planning (Bus, Train, Metro, Auto-rickshaw)
- Real-time vehicle tracking and arrival predictions
- Route optimization and alternative suggestions
- Transport capacity and crowding management

### **Service Integration**
- Public transit API integrations
- Live tracking systems
- Route and schedule management
- Transport mode switching logic

### **User Experience**
- Transport option recommendations
- Emergency transport handling
- Ride matching and sharing
- Journey planning and optimization

## 📂 File Ownership

### **Components I Manage**
- `TransportModeSelector.jsx` - Transport type selection
- `PublicTransitMap.jsx` - Public transport visualization
- `PublicTransitTracker.jsx` - Real-time tracking
- `RouteMap.jsx` - Route planning and display
- `JourneyPlanner.jsx` - Multi-modal trip planning

### **Backend Services**
- `transportService.js` - Core transport logic
- `routingService.js` - Route calculation
- Transport API endpoints
- Live tracking system

### **Database Tables**
- `transport_types` - Available transport modes
- `transport_routes` - Route definitions
- `transport_stops` - Stop locations and details
- `live_tracking` - Real-time vehicle positions
- `arrival_predictions` - Estimated arrival times

## 🔄 Current Status & Last Updated
**Last Context Update**: 2025-01-21  
**Current Tasks**: Multi-agent system setup  
**Active Features**: Multi-modal transport support, live tracking  
**Next Priority**: Enhanced route optimization and real-time updates  

## 🔄 Last Interaction Update
**Date**: 2025-01-21  
**Action**: Updated context file with mandatory context update protocol  
**Files Modified**: AGENT_CONTEXTS/TRANSPORT_AGENT.md  
**Coordination**: Responding to multi-agent system coordination requirement  
**Next Priority**: Implement context read/update cycle for all future interactions  
**User Feedback**: Critical requirement for persistent memory across terminal crashes identified  

## 🤝 Agent Interactions

### **Coordination with Other Agents**
- **USER_PROFILE_AGENT**: Get user transport preferences and accessibility needs
- **MAP_AGENT**: Coordinate route display and geographic data
- **EMERGENCY_AGENT**: Provide urgent transport options
- **COMMUNITY_AGENT**: Share crowdsourced transport data

## 📊 Metrics I Track
- Transport mode usage statistics
- Route efficiency and timing accuracy
- User satisfaction with transport recommendations
- System reliability and uptime

## 🚨 Critical Notes
- Prioritize public transport and sustainable options
- Maintain real-time data accuracy
- Support accessibility requirements
- Focus on community-driven transport sharing

## 📊 DECISION CHANGELOG
**Persistent record of critical decisions and their reasoning**

### 2025-01-21 - Multi-Agent Context Protocol Implementation
**Issue**: Transport agent losing memory across terminal crashes  
**Research**: Multi-agent coordination requirements analysis  
**Decision**: Mandatory context read/update cycle for every interaction  
**Implementation**: Read context → Process → Update context → Respond workflow  
**Reasoning**: Ensures persistent memory and cross-agent coordination reliability  
**Result**: Transport agent now maintains state across terminal crashes  

### 2025-01-21 - Multi-Modal Transport Architecture
**Issue**: Need comprehensive transport coordination system  
**Research**: Analysis of existing transport components and backend services  
**Decision**: Centralized transport coordination with specialized components  
**Implementation**: TransportModeSelector, PublicTransitMap, RouteMap integration  
**Reasoning**: Supports bus, train, metro, auto-rickshaw with unified interface  
**Result**: Complete multi-modal transport support with real-time tracking  

---
*Auto-updated by TRANSPORT_AGENT | Changelog preserves transport decisions*