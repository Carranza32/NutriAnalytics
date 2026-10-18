<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Factura extends Model
{
    protected $table = 'encfct';

    protected $primaryKey = 'ID_Fac';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'CodEmp',
        'ID_Fac',
        'codsuc',
        'tipfct',
        'numfct',
        'codcli',
        'codbod',
        'fecfct',
        'fecven',
        'shipto',
        'dirship',
        'codven',
        'valgrv',
        'valexe',
        'iva',
        'estado',
    ];

    protected $casts = [
        'fecfct' => 'datetime',
        'fecven' => 'datetime',
        'valgrv' => 'float',
        'valexe' => 'float',
        'iva' => 'float',
    ];

    public function detalles(): HasMany
    {
        return $this->hasMany(FacturaDetalle::class, 'ID_Fac', 'ID_Fac');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'codcli', 'codcli');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Vendedor::class, 'codven', 'codven');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'codsuc', 'codsuc');
    }

    /**
     * Scope para excluir facturas anuladas (estado = 'A').
     */
    public function scopeValida(Builder $query): Builder
    {
        return $query->where('encfct.estado', '!=', 'A');
    }

    /**
     * Accesor para calcular la venta neta (gravada + exenta).
     */
    public function getTotalVentaAttribute(): float
    {
        return round(((float) $this->valgrv) + ((float) $this->valexe), 2);
    }
}
