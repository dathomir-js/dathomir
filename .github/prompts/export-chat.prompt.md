---
mode: "agent"
model: "GPT-5 mini"
tools: ["createFile"]
description: Export the entire conversation history to a Markdown file in .github/instructions/
---

# Export Chat History

When the user types `/export-chat`, export the entire conversation history to a Markdown file.

## Instructions

1. **Generate filename**: Create a filename in the format `{timestamp}-{title}.instructions.md`
   - `{timestamp}`: Use ISO 8601 format `YYYYMMDD-HHmmss` (e.g., `20251207-143022`)
   - `{title}`: Generate a short, descriptive title based on the conversation content (use kebab-case, max 50 characters)
   - Example: `20251207-143022-export-chat-implementation.instructions.md`

2. **File location**: Save the file to `.github/instructions/`

3. **Content format**: Export the conversation in the following Markdown format with YAML frontmatter:

```markdown
---
applyTo: '**'
priority: 1
archived: true
---

# Chat History: {descriptive title}

**Date**: {YYYY-MM-DD HH:mm:ss}

---

## Conversation

user:
{user message content}

copilot:
{copilot response content}

user:
{user message content}

copilot:
{copilot response content}

---

**End of conversation**
```

**Frontmatter fields**:
- `applyTo`: Always set to `'**'` (applies to all files)
- `priority`: Set to `1` (low priority, archived conversations)
- `archived`: Set to `true` (marks this as historical reference)

4. **Include all messages**: Export the complete conversation from the beginning to the current message
5. **Preserve formatting**: Maintain code blocks, lists, and other Markdown formatting in the messages
6. **Confirmation**: After creating the file, confirm the export with the filename and location

## Example Usage

User types: `/export-chat`

Copilot:
1. Analyzes the conversation
2. Generates appropriate filename (e.g., `20251207-143022-export-chat-implementation.instructions.md`)
3. Creates the file in `.github/instructions/`
4. Confirms: "✅ Chat history exported to `.github/instructions/20251207-143022-export-chat-implementation.instructions.md`"
