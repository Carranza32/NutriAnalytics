<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacturaDetalle extends Model
{
    protected $table = 'detfct';

    protected $primaryKey = 'ID';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'CodEmp',
        'id_fac',
        'tipfct',
        'numfct',
        'fecfct',
        'codbod',
        'codprd',
        'tipvta',
        'qtyvta',
        'prcact',
        'unidad',
        'pdesc',
        'ID',
    ];

    protected $casts = [
        'qtyvta' => 'float',
        'prcact' => 'float',
        'pdesc' => 'float',
        'fecfct' => 'datetime',
    ];

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class, 'id_fac', 'id_fac');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'codprd', 'codprd');
    }

    /**
     * Accesor para calcular el subtotal de la línea de factura con descuento.
     */
    public function getSubtotalAttribute(): float
    {
        $qty = (float) $this->qtyvta;
        $price = (float) $this->prcact;
        $discountPct = (float) $this->pdesc;

        return round($qty * $price * (1 - ($discountPct / 100)), 2);
    }
}
