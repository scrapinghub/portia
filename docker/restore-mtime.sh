#!/bin/bash
commit=$(git rev-list -n 1 HEAD requirements.txt)
mtime=$(git show --pretty=format:%ai --abbrev-commit $commit |head -n1)
touch -d "$mtime" requirements.txt
