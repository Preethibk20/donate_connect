@echo off
title DonateConnect - Spring Boot Backend
echo Starting DonateConnect Backend (Spring Boot 3 + PostgreSQL)...
cd /d "%~dp0backend"
call mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Djava.net.preferIPv4Addresses=true"
pause
