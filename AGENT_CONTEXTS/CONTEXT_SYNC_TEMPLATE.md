# 🔄 AGENT CONTEXT SYNC TEMPLATE

## How to Update Your Agent Context

**MANDATORY**: Every agent interaction MUST update its context file using this template.

### **Context Update Format**
Add this section to your agent context file after each interaction:

```markdown
## 🔄 Last Interaction Update
**Date**: [Current Date]
**Action**: [Brief description of what was done]
**Files Modified**: [List of files changed/created/deleted]
**Coordination**: [Other agents involved, if any]
**Next Priority**: [What should be done next]
**User Feedback**: [Any feedback received from user]

### **Technical Changes**
- [List technical changes made]
- [Component updates]
- [API modifications]
- [Database schema changes]

### **User Experience Impact**
- [How changes affect user experience]
- [New features available]
- [Improvements made]

### **Integration Points**
- [How this affects other agents]
- [Shared resources modified]
- [Coordination requirements]
```

### **Example Context Update**

```markdown
## 🔄 Last Interaction Update
**Date**: 2025-01-21
**Action**: Enhanced user profile component with new gamification features
**Files Modified**: Profile.jsx, socialScoreService.js, user.sql
**Coordination**: COMMUNITY_AGENT for social scoring updates
**Next Priority**: Implement achievement badge system
**User Feedback**: Users want more visual feedback on community contributions

### **Technical Changes**
- Added achievement tracking to Profile.jsx
- Updated socialScoreService.js with new scoring algorithms
- Modified user database schema for badge storage

### **User Experience Impact**
- Users now see visual progress indicators for community contributions
- Achievement badges provide motivation for continued engagement
- Social scoring more transparent and encouraging

### **Integration Points**
- COMMUNITY_AGENT will need to update badge display logic
- TRANSPORT_AGENT should consider user achievement level in recommendations
- MAP_AGENT can show achievement-based location features
```

### **Automation Reminder**
This update should happen automatically after each interaction. If manual update is needed:

1. Read your agent context file
2. Add the update section at the end
3. Commit the changes
4. Notify other agents if coordination is needed

---
*This template ensures persistent agent memory across terminal sessions*