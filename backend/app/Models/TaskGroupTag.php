<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\TaskGroup;
use App\Models\Tag;

class TaskGroupTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_group_uuid',
        'tag_id',
    ];

    public function taskGroup()
    {
        return $this->belongsTo(TaskGroup::class);
    }

    public function tag()
    {
        return $this->belongsTo(Tag::class);
    }
}
