<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use app\Models\NoteTag;

class Note extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'uuid',
        'title',
        'content',
        'ends_at',
        'user_id',
        'updated_at',
        'created_at',
    ];

    protected $primaryKey = 'uuid';

    public function noteTags()
    {
        return $this->hasMany(NoteTag::class);
    }
}
