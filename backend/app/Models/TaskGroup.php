<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\TaskGroupTag;
use App\Models\TaskStatus;

class TaskGroup extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'task_statuses',
        'user_id',
        'next_reset',
        'reset_interval',
        'ends_at',
        'uuid',
        'created_at',
        'updated_at'
    ];

    protected $primaryKey = 'uuid';

    public function taskGroupTags()
    {
        return $this->hasMany(TaskGroupTag::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
