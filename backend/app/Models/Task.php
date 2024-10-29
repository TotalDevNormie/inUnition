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
        'name',
        'description',
        'status',
        'task_group_uuid',
        'user_id',
        'created_at',
        'updated_at',
    ];

    protected $primaryKey = 'uuid';
}
