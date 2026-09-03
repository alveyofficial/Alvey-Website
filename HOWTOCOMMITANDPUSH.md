# How to commit and push (without losing work or having merge conflicts)

Assumes you already have `dev` cloned and you're working inside that folder.

## Before you write any new code, get on latest version

Always do this first, every session, before touching a file. PLEASE

```
git fetch origin
git checkout dev
git status
```

Check the output of `git status`.

- If it says `nothing to commit, working tree clean` meaning safe to hard reset:
  ```
  git reset --hard origin/dev
  ```
- If it lists files under `Changes not staged` or `Changes to be committed` then **do not hard reset**. You have uncommitted edits to files that already exist in the repo. Commit them first (see below) or `git stash` them, then reset, then `git stash pop`.
- If it only lists files under `Untracked files` then those are new files you made that were never `git add`ed. `git reset --hard` does **not** touch untracked files, so you're safe to reset even with these present.

`git reset --hard origin/dev` deletes all local changes to tracked files with no recovery. It does not touch new/untracked files. Know which bucket your changes are in before running it.

## Normal workflow i.e. after you've made changes

```
git add <specific files>
```

Don't `git add .` blindly, you'll commit things you didn't mean to (`.env`, `node_modules`, stray test files). Add files by name.

```
git commit -m "short description of what changed"
```

One line, plain, says what changed. Not "fixed stuff."

## Before you push, pull first, always

Someone else may have pushed while you were working. Pushing without pulling first gets rejected.

```
git fetch origin
git pull origin dev
```

If it merges clean, you'll see a merge commit or fast-forward message. If it conflicts, git tells you exactly which files. Open those, look for `<<<<<<<`, `=======`, `>>>>>>>` markers, manually pick the correct version, remove the markers, then:

```
git add <the files you just fixed>
git commit
```

(No `-m` needed here, it'll open the default merge commit message, just save and close it.)

## Now push

```
git push origin dev
```

If this gets rejected with "updates were rejected because the remote contains work that you do not have," it means someone pushed again between your pull and your push. Just repeat the pull step above and push again.

## Quick reference, in order

```
git fetch origin
git status
git reset --hard origin/dev      # only if working tree is clean
# ...write code...
git add <files>
git commit -m "..."
git fetch origin
git pull origin dev
# fix conflicts if any, then git add + git commit
git push origin dev
```