<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sucursal extends Model
{
    protected $table = 'sucursales';

    protected $primaryKey = 'codsuc';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'codsuc',
        'nomsuc',
    ];

    public function facturas(): HasMany
    {
        return $this->hasMany(Factura::class, 'codsuc', 'codsuc');
    }
}
