<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderDetail extends Model
{
    protected $table = 'order_details';
    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'order_id',
        'product_id',
        'unit_price',
        'quantity',
        'discount',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'product_id' => 'integer',
        'unit_price' => 'float',
        'quantity' => 'integer',
        'discount' => 'float',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function getSubtotalAttribute(): float
    {
        return round($this->unit_price * $this->quantity * (1 - $this->discount), 2);
    }
}
