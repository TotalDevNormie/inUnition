<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'user_id'
    ];

    public function noteTags()
    {
        return $this->hasMany(NoteTag::class);
    }

    public function taskGroupTags()
    {
        return $this->hasMany(TaskGroupTag::class);
    }

    public static function getAllTagsWithRelations()
    {
        $user = Auth::user();

        $tags = self::where('user_id', $user->id)->get();

        return $tags->mapWithKeys(function ($tag) {
            $relations = [];

            // Add notes
            foreach ($tag->noteTags as $noteTag) {
                if ($noteTag->note_uuid) {
                    $relations[] = [
                        'uuid' => $noteTag->note_uuid,
                        'type' => 'note'
                    ];
                }
            }

            // Add task groups
            foreach ($tag->taskGroupTags as $taskGroupTag) {
                if ($taskGroupTag->task_group_uuid) {
                    $relations[] = [
                        'uuid' => $taskGroupTag->task_group_uuid,
                        'type' => 'taskGroup'
                    ];
                }
            }

            return [$tag->name => $relations->all()];
        })->all();
    }
}
