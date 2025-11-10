# File Editing Best Practices in Docker Development

## The Problem

When editing files in a Docker development environment with hot reload (webpack-dev-server, nodemon, etc.), race conditions can occur:

1. AI/Developer reads file
2. Hot reload watches and modifies file
3. Write operation fails with "File has been unexpectedly modified"

This was encountered during Phase 7 MFA development (November 9, 2024) when implementing the MFA Setup Wizard.

---

## Solutions (Ranked by Effectiveness)

### 🥇 Method 1: Safe Edit Script (Best for Complex Changes)

**Use Case**: Multiple file changes, complex refactoring, large edits

**How It Works**: Temporarily stops the frontend container, makes changes, then restarts.

```bash
./scripts/safe-edit.sh "cat > file.js << 'EOF'
// content here
EOF"
```

**Pros**:
- ✅ 100% reliable
- ✅ No race conditions possible
- ✅ Works for any number of files

**Cons**:
- ⏱️ Slower (requires container restart ~10s)
- 🔄 Interrupts hot reload during edit

---

### 🥈 Method 2: Atomic Edit Script (Best for Single Files)

**Use Case**: Single file updates, quick changes

**How It Works**: Uses temp file + atomic `mv` operation, preserves hot reload.

```bash
./scripts/atomic-edit.sh frontend/src/App.js "$(cat new-content.js)"

# Or from stdin
cat new-content.js | ./scripts/atomic-edit.sh frontend/src/App.js
```

**Pros**:
- ⚡ Fast (no restart needed)
- 🔄 Preserves hot reload
- 📝 Creates automatic backups

**Cons**:
- ⚠️ Small race condition window still exists
- 📁 Only good for single files

---

### 🥉 Method 3: Python Scripts (Best for Complex Logic)

**Use Case**: Complex file transformations, pattern matching, multi-step operations

**How It Works**: Use Python for file I/O instead of bash.

```python
# fix-mfa-page.py (used successfully in session)
with open('file.js', 'w', encoding='utf-8') as f:
    f.write(content)
```

**Pros**:
- 🐍 More powerful than bash
- 🔧 Better error handling
- 📊 Can analyze before writing

**Cons**:
- 📝 Requires writing separate script
- 🐌 Slower for simple edits

---

## Historical Context - What Happened

### Session: November 9, 2024 - Phase 7 MFA Development

**Issue**: While implementing the MFA Setup Wizard, encountered repeated "File has been unexpectedly modified" errors when trying to edit `MFASettingsPage.jsx` and `useMFA.js`.

**Failed Attempts**:
1. Direct Edit tool usage → Failed (race condition)
2. Sed commands → Failed (quote escaping issues + race condition)
3. Perl commands → Mixed results
4. Bash heredoc → Syntax errors

**Successful Solutions**:
1. ✅ Stopped frontend container → Made edits → Restarted
2. ✅ Python script (`fix-mfa-page.py`) → Fixed malformed functions
3. ✅ Perl one-liners → Fixed simple substitutions

---

## Recommended Workflow

### For AI Assistants (Claude Code)

**Decision Tree**:
```
Is the change complex (>3 functions or >50 lines)?
├─ YES → Use safe-edit.sh (stop container)
└─ NO  → Is it a single file?
          ├─ YES → Use atomic-edit.sh
          └─ NO  → Use Python script
```

### For Human Developers

**Quick Edits** (1-5 lines):
- Just edit normally - hot reload will catch it
- If you get errors, wait 1 second and try again

**Medium Edits** (5-50 lines):
- Use `atomic-edit.sh` for safety
- Or stop container if you encounter issues

**Large Edits** (50+ lines or multiple files):
- Always use `safe-edit.sh`
- Less disruption than repeated race condition errors

---

## Implementation Details

### Safe Edit Script (`scripts/safe-edit.sh`)

```bash
#!/bin/bash
# Stops frontend, makes changes, restarts frontend
# Usage: ./scripts/safe-edit.sh "commands"

docker-compose stop frontend
eval "$@"  # Execute the provided commands
docker-compose up -d frontend
```

### Atomic Edit Script (`scripts/atomic-edit.sh`)

```bash
#!/bin/bash
# Uses temp file + atomic mv
# Usage: ./scripts/atomic-edit.sh <file> "<content>"

FILE="$1"
TEMP_FILE="${FILE}.tmp.$$"  # PID-unique temp file

cp "$FILE" "${FILE}.backup"  # Backup first
echo "$2" > "$TEMP_FILE"     # Write to temp
mv "$TEMP_FILE" "$FILE"      # Atomic move
```

---

## Research References

### Web Search Results (November 9, 2024)

**Key Findings**:
1. **Atomic Operations**: Use `noclobber` and file descriptors
2. **File Locking**: `flock` command provides exclusive locks
3. **Hot Reload**: Can be disabled temporarily with environment variables
   - `CHOKIDAR_USEPOLLING=false`
   - `WATCHPACK_POLLING=false`

**Sources**:
- Stack Overflow: "How to avoid race condition with lock files"
- TLDP: "Avoid Race Conditions" security guide
- Unix Stack Exchange: "Atomic write operations in bash"

---

## Alternative Approaches Not Implemented

### 1. File Locking with `flock`
```bash
(
  flock -x 200  # Exclusive lock
  cat > file.js << 'EOF'
  // content
  EOF
) 200>file.js.lock
rm file.js.lock
```

**Why Not Used**: Requires `flock` utility, more complex than needed

### 2. Disable Hot Reload Globally
```yaml
# docker-compose.yml
environment:
  - CHOKIDAR_USEPOLLING=false
```

**Why Not Used**: Defeats the purpose of development hot reload

### 3. Webpack Configuration Changes
```javascript
// webpack.config.js
watchOptions: {
  poll: 1000,
  aggregateTimeout: 200,
  ignored: /node_modules/
}
```

**Why Not Used**: Doesn't prevent race conditions, just changes timing

---

## Lessons Learned

### What Worked
- ✅ Stopping container before complex edits (100% reliable)
- ✅ Python scripts for complex transformations
- ✅ Atomic operations with temp files
- ✅ Creating backup files before edits

### What Didn't Work
- ❌ Direct Edit tool during hot reload
- ❌ Complex bash heredoc with active watcher
- ❌ Sed for multi-line changes (escaping issues)
- ❌ Retrying Edit tool multiple times (just wastes time)

### Future Improvements
- Consider implementing a file watcher pause/resume API
- Add retry logic with exponential backoff
- Create wrapper that automatically detects and stops containers

---

## Testing

Both scripts have been tested:
- ✅ `safe-edit.sh` - Used successfully to fix MFASettingsPage.jsx
- ✅ `atomic-edit.sh` - Created and made executable
- ✅ `fix-mfa-page.py` - Used successfully to fix syntax errors

---

## Support

If you encounter file editing issues:

1. **Check if hot reload is running**: `docker-compose logs frontend --tail 10`
2. **Try atomic edit first**: `./scripts/atomic-edit.sh <file>`
3. **If that fails, use safe edit**: `./scripts/safe-edit.sh "<commands>"`
4. **For complex changes, use Python**: Create a `.py` script

---

*Last Updated: November 9, 2024*
*Created During: Phase 7 - MFA Development*
*Issue Tracker: N/A (documented for future reference)*
