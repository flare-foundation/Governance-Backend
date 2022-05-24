#!/bin/bash

USER=backend
SERVER=10.0.0.154
WORKDIR="di-gozd-dev"
FNAME=latest-di-gozd.tgz
BACKUPDIR="di-gozd-backups-dev"
CONFIGDIR="di-gozd-config-dev"
BRANCH=development
SERVICE=di-gozd-dev

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
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo -e "${REDBOLD}Wrong branch for deployment: '$CURRENT_BRANCH'. Should be '$BRANCH'.${NC}";
  exit 1;
fi

# Test if build works locally
npm run build || { echo 'Local build failed. Check errors and fix the code.' ; exit 1; }

# Archive current branch to $FNAME
echo "Archive started ..."
git archive $BRANCH | gzip > tmp_data/$FNAME || { echo 'Archive failed' ; exit 1; }

# Copy $FNAME to server
echo -e "${GREENBOLD}Archiving done.${NC} Copying to server ..."
scp tmp_data/$FNAME $USER@$SERVER:~ || { echo 'sco failed' ; exit 1; }

# Do the following:
# - Clean $WORKDIR. 
# - Extract the archived app from $FNAME into $WORKDIR (app is run from here)
# - backup $FNAME with timestamp in name in $BACKUPDIR
# - override .env and docker-compose.yaml files from $CONFIGDIR. These files contain credential and must be set up on server.
echo -e "${GREENBOLD}Copying to server done.${NC} Installing ..."
ssh -n $USER@$SERVER "rm -rf $WORKDIR/*; mv $FNAME $WORKDIR; cd $WORKDIR; tar xzf $FNAME; mv $FNAME ../$BACKUPDIR/deploy--$(date +\"%Y-%m-%d--%H-%M-%S\").tgz; cp ../$CONFIGDIR/.env .;" || { echo 'Remote deployment failed' ; exit 1; }

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


# Configuration of the service di-gozd-dev