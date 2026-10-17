<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendedor extends Model
{
    protected $table = 'vendedores';

    protected $primaryKey = 'codven';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'CodEmp',
        'codven',
        'nomven',
        'estado',
    ];

    public function facturas(): HasMany
    {
        return $this->hasMany(Factura::class, 'codven', 'codven');
    }
}
