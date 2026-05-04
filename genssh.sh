#!/bin/bash
# this script automatically connects github repository to ssh

echo "Available SSH keys:"
ls -al ~/.ssh
ssh -T git@github.com
git remote -v
echo "Enter your github repository SSH url with 'git remote set-url otigin'"
