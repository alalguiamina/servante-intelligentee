@echo off
title Servante Intelligentee - Shutdown

echo Stopping Docker infrastructure...
docker-compose -f docker-compose.infra.yml down
echo Done. Close the Backend, Frontend, and Serial Bridge windows manually.
pause
