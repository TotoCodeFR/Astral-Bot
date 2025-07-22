@echo off
echo === Sauvegarder sur GitHub ===

:: Get commit message from user
set /p commit_message=Message de commit: 

:: Add all changes
git add .

:: Commit with the provided message
git commit -m "%commit_message%"

:: Push to remote repository
echo Pushing changes to GitHub...
git push -u origin master

if %ERRORLEVEL% EQU 0 (
    echo ✅ Successfully pushed to GitHub!
) else (
    echo ❌ Error: Failed to push to GitHub
    exit /b 1
)