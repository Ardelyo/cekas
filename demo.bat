@echo off
REM CEKAS Quick Launcher for Windows PowerShell & CMD
cd /d "%~dp0"

IF EXIST ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe cekas_demo.py %*
) ELSE (
    uv run cekas_demo.py %*
)
