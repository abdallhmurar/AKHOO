# User workflow preference

The user explicitly wants completed project changes committed and pushed to GitHub as part of finishing the work. After appropriate validation, commit and push the task's changes to the intended branch without asking again. Verify the remote commit and report its link. If authentication or branch protection blocks the push, report the concrete blocker.

Keep credentials, environment files, generated build output, database snapshots, and private user data out of commits. Preserve unrelated changes and never force-push shared history.

This preference authorizes GitHub synchronization; production deployment still follows the user's task instructions.

# Coordination between agents

Before starting any task, read `READ_ME_FIRST.md` (latest copy: `git fetch origin && git show origin/main:READ_ME_FIRST.md`). It lists the rules, who owns which area, the current state of every app and branch, the reserved build and migration numbers and the change log. Before you start, claim your work in its section 2 (agent, task, branch) and remove the line when you finish. When you finish, add a short entry (3 lines at most) to its change log and update its status board and current state in the same commit. Reports to the owner are very short Levantine Arabic: what is done, what he must decide, any real risk. Work only in your own worktree and branches, and never make an official release (App Store submission, Play production, live store listing) without the owner's explicit OK.
