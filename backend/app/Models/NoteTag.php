<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Note;
use App\Models\Tag;

class NoteTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'tag_id',
        'note_id'
    ];

    public function note()
    {
        return $this->belongsTo(Note::class);
    }

    public function tag()
    {
        return $this->belongsTo(Tag::class);
    }
}
