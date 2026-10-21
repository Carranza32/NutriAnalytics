<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/icon-192.png">

        {{-- Configuración PWA adaptativa a Modo Claro y Modo Oscuro --}}
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)">
        <meta name="theme-color" content="#ffffff">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="NutriAnalytics">

        {{-- Meta tags para WhatsApp, Redes Sociales y Motores de Búsqueda --}}
        <meta name="description" content="NutriAnalytics • Portal Ejecutivo de Inteligencia Comercial y Control ERP para NutriFertil.">
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ config('app.url', 'https://nutrianalytics.onrender.com') }}">
        <meta property="og:site_name" content="NutriAnalytics">
        <meta property="og:title" content="NutriAnalytics • Portal Ejecutivo">
        <meta property="og:description" content="Plataforma de Inteligencia Comercial, Facturación, Cartera e Inventarios para NutriFertil.">
        <meta property="og:image" content="{{ config('app.url', 'https://nutrianalytics.onrender.com') }}/og-image.png">
        <meta property="og:image:secure_url" content="{{ config('app.url', 'https://nutrianalytics.onrender.com') }}/og-image.png">
        <meta property="og:image:type" content="image/png">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="NutriAnalytics • Portal Ejecutivo">
        <meta name="twitter:description" content="Plataforma de Inteligencia Comercial, Facturación, Cartera e Inventarios para NutriFertil.">
        <meta name="twitter:image" content="{{ config('app.url', 'https://nutrianalytics.onrender.com') }}/og-image.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'NutriAnalytics') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />

        {{-- Registro de Service Worker para PWA --}}
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                        console.log('SW registration error:', err);
                    });
                });
            }
        </script>
    </body>
</html>
