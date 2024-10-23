<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'uuid',
        'title',
        'description',
        'status_id',
        'group_id',
        'user_id',
        'created_at',
        'updated_at',
    ];

    protected $primaryKey = 'uuid';
}
