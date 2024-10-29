<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\NoteTag;
use App\Models\TaskGroupTag;
use App\Models\DeletedEntries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class TagController extends Controller
{
    public function saveTags(Request $request)
    {
        try {
            $request->validate(['tags' => 'array']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }

        foreach ($request->tags as $tagGroup) {
            foreach ($tagGroup as $tag) {
                try {
                    $this->save($tag);
                } catch (\Exception $e) {
                    return response()->json($e->getMessage(), 422);
                }
            }
        }

        return response()->json(['message' => 'tags saved'], 200);
    }

    public function getTags(Request $request)
    {
        $tagsQuery = Tag::where('user_id', auth()->user()->id);
        $deletedQuery = DeletedEntries::where('user_id', auth()->user()->id)
            ->where('type', 'tag');

        if (isset($request['timestamp'])) {
            $timestamp = Carbon::parse($request['timestamp']);
            $tagsQuery = $tagsQuery->where('updated_at', '>=', $timestamp);
            $deletedQuery = $deletedQuery->where('updated_at', '>=', $timestamp);
        }

        // Get all tags and organize them by their relationships
        $tags = $tagsQuery->get();
        $result = [];

        foreach ($tags as $tag) {
            // Get note relationships
            $noteRelations = NoteTag::where('tag_id', $tag->id)
                ->join('notes', 'notes.uuid', '=', 'note_tags.note_uuid')
                ->where('notes.user_id', auth()->user()->id)
                ->select('note_uuid as uuid')
                ->get();

            // Get task group relationships
            $taskGroupRelations = TaskGroupTag::where('tag_id', $tag->id)
                ->join('task_groups', 'task_groups.uuid', '=', 'task_group_tags.task_group_uuid')
                ->where('task_groups.user_id', auth()->user()->id)
                ->select('task_group_uuid as uuid')
                ->get();

            // Add to appropriate groups in result
            foreach ($noteRelations as $relation) {
                if (!isset($result[$relation->uuid])) {
                    $result[$relation->uuid] = [];
                }
                $result[$relation->uuid][] = [
                    'uuid' => $tag->uuid,
                    'type' => 'note',
                    'created_at' => $tag->created_at,
                    'updated_at' => $tag->updated_at
                ];
            }

            foreach ($taskGroupRelations as $relation) {
                if (!isset($result[$relation->uuid])) {
                    $result[$relation->uuid] = [];
                }
                $result[$relation->uuid][] = [
                    'uuid' => $tag->uuid,
                    'type' => 'taskGroup',
                    'created_at' => $tag->created_at,
                    'updated_at' => $tag->updated_at
                ];
            }
        }

        return response()->json([
            'tags' => $result,
            'deleted' => $deletedQuery->get()
        ], 200);
    }

    private function save(array $tagInput)
    {
        if (!isset($tagInput['uuid']) || !isset($tagInput['parent_uuid']) || !isset($tagInput['type'])) {
            throw new \Exception('Missing required fields: uuid, parent_uuid, or type');
        }

        $tag = Tag::find($tagInput['uuid']);

        if (!$tag && !DeletedEntries::find($tagInput['uuid'])) {
            // Create new tag
            DB::transaction(function () use ($tagInput) {
                $updated_at = isset($tagInput['updated_at']) ? Carbon::parse($tagInput['updated_at']) : Carbon::now();
                $created_at = isset($tagInput['created_at']) ? Carbon::parse($tagInput['created_at']) : Carbon::now();

                $tag = Tag::create([
                    'uuid' => $tagInput['uuid'],
                    'user_id' => auth()->user()->id,
                    'updated_at' => $updated_at,
                    'created_at' => $created_at
                ]);

                // Create relationship based on type
                if ($tagInput['type'] === 'note') {
                    NoteTag::create([
                        'tag_id' => $tag->id,
                        'note_uuid' => $tagInput['parent_uuid']
                    ]);
                } else if ($tagInput['type'] === 'taskGroup') {
                    TaskGroupTag::create([
                        'tag_id' => $tag->id,
                        'task_group_uuid' => $tagInput['parent_uuid']
                    ]);
                }
            });
        } elseif ($tag) {
            // Update existing tag
            $oldUpdated = $tag->updated_at->timestamp;
            $newUpdated = isset($tagInput['updated_at']) ? Carbon::parse($tagInput['updated_at'])->timestamp : 0;

            if ($oldUpdated <= $newUpdated) {
                DB::transaction(function () use ($tag, $tagInput) {
                    $tag->updated_at = Carbon::parse($tagInput['updated_at']);
                    $tag->save();

                    // Update relationships if needed
                    if ($tagInput['type'] === 'note') {
                        NoteTag::updateOrCreate(
                            ['tag_id' => $tag->id],
                            ['note_uuid' => $tagInput['parent_uuid']]
                        );
                    } else if ($tagInput['type'] === 'taskGroup') {
                        TaskGroupTag::updateOrCreate(
                            ['tag_id' => $tag->id],
                            ['task_group_uuid' => $tagInput['parent_uuid']]
                        );
                    }
                });
            }
        }
    }

    public function deleteTag(Request $request)
    {
        try {
            $request->validate(['uuid' => 'string']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }

        try {
            $tag = Tag::find($request->uuid);
            if (!$tag) {
                return response()->json(['error' => 'Tag not found'], 422);
            }

            // Delete the tag and its relationships
            DB::transaction(function () use ($tag) {
                NoteTag::where('tag_id', $tag->id)->delete();
                TaskGroupTag::where('tag_id', $tag->id)->delete();
                $tag->delete();
            });

            DeletedEntries::create([
                'uuid' => $request->uuid,
                'type' => 'tag',
                'user_id' => auth()->user()->id
            ]);

            return response()->json(['message' => 'tag deleted'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete tag'], 422);
        }
    }
}