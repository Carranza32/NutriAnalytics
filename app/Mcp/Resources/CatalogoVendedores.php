<?php

namespace App\Mcp\Resources;

use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Description('Catálogo de asesores comerciales y vendedores registrados en GeoSoft ERP.')]
#[Uri('agro://catalogo/vendedores')]
#[MimeType('application/json')]
class CatalogoVendedores extends Resource
{
    /**
     * Retorna el listado de vendedores activos en formato JSON.
     */
    public function handle(Request $request): Response
    {
        $vendedores = DB::table('vendedores')
            ->select(
                DB::raw('RTRIM(codven) as id'),
                DB::raw('RTRIM(nomven) as nombre')
            )
            ->whereNotNull('nomven')
            ->orderBy('nombre')
            ->get();

        return Response::text(json_encode($vendedores, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
