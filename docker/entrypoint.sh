#!/bin/sh

if [ "$(id -u)" = '0' ]; then
	mkdir -p ${HOME}/governance-backend/logs
	chown -R backend:backend ${HOME}/governance-backend/logs
	exec gosu backend "$@"
fi

exec "$@"
