#!/bin/bash

USER=backend
SERVER=0.0.0.1
PROJECT="governance-backend"
WORKDIR="$PROJECT"
FNAME=latest-${PROJECT}.tgz
BACKUPDIR="${PROJECT}-backups"
CONFIGDIR="${PROJECT}-config"
BRANCH=origin
SERVICE="$PROJECT"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
REDBOLD="${RED}$(tput bold)"
GREENBOLD="${GREEN}$(tput bold)"
NCNORMAL="${NC}$(tput sgr0)"


# Check if everything is commited localy
if ! git diff-index --quiet HEAD --; then
  echo -e "${REDBOLD}Uncommitted changes! Please commit the changes first.${NC}";
  exit 1;
fi

# Check if correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo -e "${REDBOLD}Wrong branch for deployment: '$CURRENT_BRANCH'. Should be '$BRANCH'.${NC}";
  exit 1;
fi

# Make sure the development branch is merged into origin
# https://stackoverflow.com/questions/226976/how-can-i-know-if-a-branch-has-been-already-merged-into-master
origin_commit_hash=$(git rev-parse $BRANCH)
dev_commit_hash=$(git rev-parse $DEVEL_BRANCH)
common_base=$(git merge-base $dev_comm $main_comm)
if [ $common_base != $dev_commit_hash ]; then
  echo -r "${REDBOLD}The development branch has not been merged into origin! Please first merge into origin before deploying to production.${NC}";
  exit 1;
fi

# Do the following:
# - override .env and docker-compose.yaml files from $CONFIGDIR. These files contain credential and must be set up on server.
# echo -e "${GREENBOLD}Copying to server done.${NC}   Installing ..."

echo "Installing ..."
# Copy the dev files to production files and archive the current prod version
ssh -n $USER@$SERVER 
    "tar -czf prod-$origin_commit_hash.tar.gz $WORKDIR;
    mv prod-$origin_commit_hash.tar.gz $BACKUPDIR/prod--$(date +\"%Y-%m-%d--%H-%M-%S\").tar.gz;
    rsync -a --delete -vh $WORKDIR-dev/ $WORKDIR
    cp $CONFIGDIR/.env $WORKDIR"
    || { echo 'Remote deployment failed' ; exit 1; }


# Run npm install in $WORKDIR 
echo -e "${GREENBOLD}Installing done.${NC} Running npm install ..."
ssh -n $USER@$SERVER "cd $WORKDIR; npm install" || { echo 'NPM install failed' ; exit 1; }

# Build the app.
echo -e "${GREENBOLD}NPM install done.${NC} Building app ... "
ssh -n $USER@$SERVER "cd $WORKDIR; npm run build" || { echo 'Building app failed' ; exit 1; }

# Restart the app as a service.
echo -e "${GREENBOLD}Build successful.${NC} Restarting app"
ssh -n $USER@$SERVER "systemctl --user restart $SERVICE" || { echo 'Restarting app failed' ; exit 1; }
echo -e "${GREENBOLD}Done.${NC}"
