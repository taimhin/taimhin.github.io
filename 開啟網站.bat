@echo off
chcp 65001 >nul
title 戴文軒 · 煙花攝影作品集
cd /d "%~dp0"
echo.
echo   戴文軒 TAI MAN HIN — 煙花攝影作品集
echo   正在為你開啟網站預覽...
echo.
start "" "index.html"
echo   已開啟!若瀏覽器沒有自動彈出,請手動雙擊 index.html。
timeout /t 6 >nul
