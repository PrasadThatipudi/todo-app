#! /bin/bash

git config --global core.editor "code --wait"
git config --global commit.template ./.git-message

chmod u+x ./hooks/pre-commit
chmod u+x ./hooks/pre-push
cp ./hooks/pre-commit .git/hooks
cp ./hooks/pre-push .git/hooks

echo "--------------------------repo initialized---------------------------"  
