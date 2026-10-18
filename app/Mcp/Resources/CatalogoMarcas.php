<?php

namespace App\Mcp\Resources;

use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Description('Catálogo de marcas y rubros de productos e insumos agrícolas en GeoSoft ERP.')]
#[Uri('agro://catalogo/marcas')]
#[MimeType('application/json')]
class CatalogoMarcas extends Resource
{
    /**
     * Retorna el listado de marcas/rubros en formato JSON.
     */
    public function handle(Request $request): Response
    {
        $marcas = DB::table('rubros')
            ->select(
                DB::raw('RTRIM(codrub) as id'),
                DB::raw('RTRIM(nomrub) as nombre')
            )
            ->whereNotNull('nomrub')
            ->orderBy('nombre')
            ->get();

        return Response::text(json_encode($marcas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
