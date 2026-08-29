@echo off
title DonateConnect - Spring Boot Backend
echo Starting DonateConnect Backend (Java 21 + Spring Boot 3)...
set "JAVA_HOME=C:\Users\Pruthvi Upadhya\.gemini\antigravity\scratch\tools\jdk-21.0.6+7"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "C:\Users\Pruthvi Upadhya\.gemini\antigravity\scratch\donateconnect\backend"
"C:\Users\Pruthvi Upadhya\.gemini\antigravity\scratch\tools\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
pause
