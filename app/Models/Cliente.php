<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $primaryKey = 'codcli';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'CodEmp',
        'codcli',
        'nomcli',
        'dircli',
        'telefono1',
        'nit',
        'nrc',
        'codven',
        'estado',
    ];

    public function facturas(): HasMany
    {
        return $this->hasMany(Factura::class, 'codcli', 'codcli');
    }
}
