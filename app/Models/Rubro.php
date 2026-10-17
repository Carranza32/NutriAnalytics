<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rubro extends Model
{
    protected $table = 'rubros';

    protected $primaryKey = 'codrub';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'codrub',
        'nomrub',
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'codrub', 'codrub');
    }
}
