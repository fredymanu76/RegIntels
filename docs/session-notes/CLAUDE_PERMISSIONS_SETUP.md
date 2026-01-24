# Claude Code - Reduce Permission Prompts

## Method 1: Use Hooks Configuration (Recommended)

Edit your Claude Code settings to allow certain commands without prompting:

1. Open Claude Code settings:
   - Press `Ctrl+,` or `Cmd+,`
   - Search for "hooks" or "permissions"

2. Add allowed command patterns to bypass prompts

## Method 2: Session-based Permissions

When Claude asks for permission, you can:
- Say "yes to all" or "approve all bash commands"
- This grants permission for the current session

## Method 3: Environment Variable

Set this in your shell:
```bash
export CLAUDE_AUTO_APPROVE=true
```

## For This Project Specifically

You can tell Claude:
"For this session, approve all bash commands, file operations, and Supabase operations automatically"

This gives blanket approval for the current conversation.

---
**Note**: The safest approach is Method 2 - giving session-based approval verbally
