#!/bin/bash
# Automated rollback for a specific user story
# Usage: ./rollback-story.sh <story-id>
# Example: ./rollback-story.sh 3.1

set -e

STORY_ID=$1

if [ -z "$STORY_ID" ]; then
  echo "Usage: ./rollback-story.sh <story-id>"
  echo "Example: ./rollback-story.sh 3.1"
  exit 1
fi

echo "============================================"
echo "  Rollback Script for Story: $STORY_ID"
echo "============================================"
echo ""

# Find commits for this story
echo "Searching for commits related to Story: $STORY_ID..."
COMMITS=$(git log --grep="Story: $STORY_ID" --format="%H" | tac)

if [ -z "$COMMITS" ]; then
  echo "❌ No commits found for Story: $STORY_ID"
  exit 1
fi

echo "✓ Found commits:"
echo "$COMMITS" | while read commit; do
  git log --oneline --format="%h - %s" $commit -1
done
echo ""

# Confirm rollback
read -p "⚠️  Rollback these commits? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "Rollback cancelled"
  exit 0
fi

echo ""
echo "Starting rollback..."
echo ""

# Revert commits (in reverse order)
for commit in $COMMITS; do
  echo "Reverting commit: $commit..."
  git revert --no-commit $commit || {
    echo "❌ Revert failed for commit $commit"
    echo "Please resolve conflicts manually"
    exit 1
  }
done

# Commit revert
echo ""
echo "Creating rollback commit..."
git commit -m "rollback: revert Story $STORY_ID

This rollback reverts all changes from Story $STORY_ID due to issues found during testing/deployment.

Commits reverted:
$COMMITS

Rolled back on: $(date)
"

echo ""
echo "✅ Rollback complete!"
echo ""
echo "Next steps:"
echo "1. Run tests: npm test"
echo "2. Verify locally: docker-compose up"
echo "3. Push changes: git push origin <branch>"
echo ""
echo "To undo this rollback:"
echo "  git reset --hard HEAD~1"
echo ""
