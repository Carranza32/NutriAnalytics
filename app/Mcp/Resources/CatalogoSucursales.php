<?php

namespace App\Mcp\Resources;

use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Description('Catálogo de sucursales activas en GeoSoft ERP (código y nombre oficial).')]
#[Uri('agro://catalogo/sucursales')]
#[MimeType('application/json')]
class CatalogoSucursales extends Resource
{
    /**
     * Retorna el listado de sucursales en formato JSON.
     */
    public function handle(Request $request): Response
    {
        $sucursales = DB::table('sucursales')
            ->select(
                DB::raw('RTRIM(codsuc) as id'),
                DB::raw('RTRIM(nomsuc) as nombre')
            )
            ->whereNotNull('nomsuc')
            ->orderBy('id')
            ->get()
            ->map(function ($s) {
                $name = trim((string) $s->nombre);
                if ($name === 'CAZA MATRIZ') {
                    $name = 'CASA MATRIZ (Santa Ana)';
                } elseif ($name === 'MASFERRER') {
                    $name = 'MASFERRER (San Salvador)';
                }

                return [
                    'id' => (string) $s->id,
                    'nombre' => $name,
                ];
            });

        return Response::text(json_encode($sucursales, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
