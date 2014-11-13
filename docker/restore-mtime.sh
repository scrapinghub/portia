#!/bin/bash
commit=$(git rev-list -n 1 HEAD slyd/requirements.txt)
mtime=$(git show --pretty=format:%ai --abbrev-commit $commit |head -n1)
touch -d "$mtime" slyd/requirements.txt

commit=$(git rev-list -n 1 HEAD slybot --)
mtime=$(git show --pretty=format:%ai --abbrev-commit $commit |head -n1)
touch -d "$mtime" slybot
