@echo off
REM ApexDrive account sync → Dad (bypasses ExecutionPolicy for this run only)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-account-to-dad.ps1" %*
exit /b %ERRORLEVEL%
