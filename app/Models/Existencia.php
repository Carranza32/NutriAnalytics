<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Existencia extends Model
{
    protected $table = 'existencias';

    public $timestamps = false;

    public $incrementing = false;

    protected $fillable = [
        'CodEmp',
        'codprd',
        'codbod',
        'exiprd',
    ];

    protected $casts = [
        'exiprd' => 'float',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'codprd', 'codprd');
    }
}
