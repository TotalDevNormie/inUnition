<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Carbon\Carbon;
use Carbon\Traits\Date;
use Illuminate\Http\Request;
use App\Models\DeletedEntries;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class NoteController extends Controller
{
    public function saveNote(Request $request)
    {
        try {
            $this->save($request->toArray());
        } catch (\Exception $e) {
            return response()->json($e->getMessage(), 422);
        }
        return response()->json(['message' => 'notes saved'], 200);

    }

    public function saveNotes(Request $request)
    {
        try {
            $request->validate(['notes' => 'array']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }

        foreach ($request->notes as $note) {
            try {
                $this->save($note);
            } catch (\Exception $e) {
                return response()->json($e->getMessage(), 422);
            }
        }

        return response()->json(['message' => 'notes saved'], 200);
    }

    public function getNotes(Request $request)
    {
        $notesQuery = Note::where('user_id', auth()->user()->id);
        $deletedQuery = DeletedEntries::where('user_id', auth()->user()->id)->where('type', 'note');

        if (isset($request['timestamp'])) {
            $timestamp = Carbon::parse($request['timestamp']);
            $notesQuery = $notesQuery->where('updated_at', '>=', $timestamp);
            $deletedQuery = $deletedQuery->where('updated_at', '>=', $timestamp);
        }

        return response()->json([
            'notes' => $notesQuery->get(),
            'deleted' => $deletedQuery->get()
        ], 200);
    }

    private function save(array $noteInput)
    {
        if (!isset($noteInput['uuid'])) {
            throw new \Exception('Missing uuid');
        }

        $note = Note::find($noteInput['uuid']);

        if (!$note && !DeletedEntries::find($noteInput['uuid'])) {
            // Create new note
            $title = isset($noteInput['title']) ? substr($noteInput['title'], 0, 100) : '';
            $content = $noteInput['content'] ?? '';
            $uuid = $noteInput['uuid'];
            $ends_at = isset($noteInput['ends_at']) ? Carbon::parse($noteInput['ends_at']) : null;

            // Convert timestamps to Carbon instances
            $updated_at = isset($noteInput['updated_at'])
                ? Carbon::parse($noteInput['updated_at'])
                : Carbon::now();
            $created_at = isset($noteInput['created_at'])
                ? Carbon::parse($noteInput['created_at'])
                : Carbon::now();

            Note::create([
                'title' => $title,
                'content' => $content,
                'uuid' => $uuid,
                'ends_at' => $ends_at,
                'user_id' => auth()->user()->id,
                'updated_at' => $updated_at,
                'created_at' => $created_at
            ]);
        } elseif ($note) {
            // Update existing note
            $oldUpdated = $note->updated_at->timestamp;
            $newUpdated = isset($noteInput['updated_at'])
                ? Carbon::parse($noteInput['updated_at'])->timestamp
                : 0;

            $isNewer = $oldUpdated <= $newUpdated;

            if ($isNewer) {
                if (isset($noteInput['title'])) {
                    $note->title = substr($noteInput['title'], 0, 100);
                }
                if (isset($noteInput['content'])) {
                    $note->content = $noteInput['content'];
                }
                if (isset($noteInput['ends_at'])) {
                    $note->ends_at = Carbon::parse($noteInput['ends_at']);
                }
                $note->updated_at = Carbon::parse($noteInput['updated_at']);
                $note->save();
            }
        }
    }

    public function deleteNote(Request $request)
    {
        try {
            $request->validate(['uuid' => 'string']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }

        Note::find($request->uuid)->delete();
        DeletedEntries::create([
            'uuid' => $request->uuid,
            'type' => 'note',
            'user_id' => auth()->user()->id
        ]);
        return response()->json(['message' => 'note deleted'], 200);
    }

}
