<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    protected $table = 'productos';

    protected $primaryKey = 'codprd';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'CodEmp',
        'codprd',
        'nomprd',
        'codrub',
        'codsub',
        'costouni',
        'unibas',
        'estado',
        'precioa',
        'preciob',
        'precioc',
    ];

    protected $casts = [
        'costouni' => 'float',
        'precioa' => 'float',
        'preciob' => 'float',
        'precioc' => 'float',
    ];

    public function rubro(): BelongsTo
    {
        return $this->belongsTo(Rubro::class, 'codrub', 'codrub');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(FacturaDetalle::class, 'codprd', 'codprd');
    }

    public function existencias(): HasMany
    {
        return $this->hasMany(Existencia::class, 'codprd', 'codprd');
    }

    public function scopeActivo(Builder $query): Builder
    {
        return $query->where('productos.estado', 'A');
    }
}
