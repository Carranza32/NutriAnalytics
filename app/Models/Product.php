<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'product_id';
    public $timestamps = false;

    protected $fillable = [
        'product_name',
        'supplier_id',
        'category_id',
        'quantity_per_unit',
        'unit_price',
        'units_in_stock',
        'units_on_order',
        'reorder_level',
        'discontinued',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'units_in_stock' => 'integer',
        'units_on_order' => 'integer',
        'reorder_level' => 'integer',
        'discontinued' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    public function orderDetails(): HasMany
    {
        return $this->hasMany(OrderDetail::class, 'product_id', 'product_id');
    }

    /**
     * Scope para productos con bajo stock o por debajo del umbral de reorden.
     */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->whereColumn('units_in_stock', '<=', 'reorder_level')
              ->orWhere('units_in_stock', '<=', 0);
        });
    }
}
