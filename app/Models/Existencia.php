<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Existencia extends Model
{
    protected $table = 'Existencias';

    public $timestamps = false;

    public $incrementing = false;

    protected $fillable = [
        'CodEmp',
        'codprd',
        'codbod',
        'Exiprd',
    ];

    protected $casts = [
        'Exiprd' => 'float',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'codprd', 'codprd');
    }
}
