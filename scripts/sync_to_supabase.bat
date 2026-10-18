@echo off
REM ==============================================================================
REM NutriAnalytics - Script de Sincronización Automática a Supabase
REM Programar esta tarea en el Programador de Tareas de Windows (Task Scheduler)
REM ==============================================================================

echo [%date% %time%] Iniciando sincronizacion hacia Supabase...
cd /d "%~dp0\.."

php artisan db:sync-supabase

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Sincronizacion completada con exito.
) else (
    echo [%date% %time%] ERROR en la sincronizacion. Revisa los logs.
)
