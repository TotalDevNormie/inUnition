<?php

namespace App\Http\Controllers;

use App\Models\DeletedEntries;
use App\Models\Note;
use App\Models\Tag;
use App\Models\Task;
use App\Models\TaskGroup;
use App\Models\TaskStatus;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    private function getModifiedData($timestamp = false): array
    {
        $notes = Note::where('updated_at', '>', $timestamp)->get();
        $taskGroups = TaskGroup::where('updated_at', '>', $timestamp)->get();
        $taskStatuses = TaskStatus::where('updated_at', '>', $timestamp)->get();
        $tasks = Task::select('tasks.*', 'task_statuses.name as task_status_name')
            ->join('task_statuses', 'tasks.task_status_id', '=', 'task_statuses.id')
            ->select('tasks.*', 'task_statuses.name as status')
            ->where('tasks.updated_at', '>', $timestamp)->get();
        $tags = Tag::getAllTagsWithRelations();

        $deletedTaskGroups = DeletedEntries::where('user_id', auth()->user()->id)
            ->where('updated_at', '>', $timestamp)
            ->where('type', 'taskGroup')->get();

        $deletedNotes = DeletedEntries::where('user_id', auth()->user()->id)
            ->where('updated_at', '>', $timestamp)
            ->where('type', 'note')->get();

        return [
            'notes' => $notes,
            'taskGroups' => $taskGroups,
            'taskStatuses' => $taskStatuses,
            'tasks' => $tasks,
            'tags' => $tags,
            'deletedTaskGroups' => $deletedTaskGroups,
            'deletedNotes' => $deletedNotes
        ];
    }

    public function sync(Request $request)
    {
        $notes = $request->input('notes') ?? [];
        $taskGroups = $request->input('taskGroups') ?? [];
        $tags = $request->input('tags') ?? [];
        $deletedNotes = $request->input('deletedNotes') ?? [];
        $deletedTasks = $request->input('deletedTasks');
        $deletedTaskGroups = $request->input('deletedTaskGroups');
        $timestamp = $request->input('timestamp') ?? 0;

        foreach ($notes as $note) {
            $this->syncNote($note, $timestamp);
        }
    }

    private function syncNote(Request $request)
    {
        if (!isset($noteInput['uuid'])) {
            throw new \Exception('Missing uuid');
        }

        $note = Note::find($noteInput['uuid']);
        if (!$note) {
            $title = isset($noteInput['title']) ? substr($noteInput['title'], 0, 100) : '';
            $content = $noteInput['content'] ?? '';
            $uuid = $noteInput['uuid'];
            $ends_at = $noteInput['ends_at'] ?? null;
            Note::create([
                'title' => $title,
                'content' => $content,
                'uuid' => $uuid,
                'ends_at' => $ends_at,
                'user_id' => auth()->user()->id
            ]);
        } else {
            $oldUpdated = $note->updated_at;
            $newUpdated = $noteInput['updated_at'] ?? $timestamp;
            $isNewer = $oldUpdated < $newUpdated;

            if ($isNewer && isset($noteInput['title'])) {
                $note->title = substr($noteInput['title'], 0, 100);
            }
            if ($isNewer && isset($noteInput['content'])) {
                $note->content = $noteInput['content'];
            }

            if ($isNewer && isset($noteInput['ends_at'])) {
                $note->ends_at = $noteInput['ends_at'];
            }

            $note->save();
        }
    }

    private function syncTask($taskInput, $timestamp)
    {
        if (!isset($taskInput['uuid'])) {
            throw new \Exception('Missing uuid');
        }

        $note = Note::find($taskInput['uuid']);
        if (!$note) {
            $title = isset($taskInput['title']) ? substr($taskInput['title'], 0, 100) : '';
            $content = $taskInput['content'] ?? '';
            $uuid = $taskInput['uuid'];
            $ends_at = $taskInput['ends_at'] ?? null;
            Note::create([
                'title' => $title,
                'content' => $content,
                'uuid' => $uuid,
                'ends_at' => $ends_at,
                'user_id' => auth()->user()->id
            ]);
        } else {
            $oldUpdated = $note->updated_at;
            $newUpdated = $taskInput['updated_at'] ?? $timestamp;
            $isNewer = $oldUpdated < $newUpdated;

            if ($isNewer && isset($taskInput['title'])) {
                $note->title = substr($taskInput['title'], 0, 100);
            }
            if ($isNewer && isset($taskInput['content'])) {
                $note->content = $taskInput['content'];
            }

            if ($isNewer && isset($taskInput['ends_at'])) {
                $note->ends_at = $taskInput['ends_at'];
            }

            $note->save();
        }
    }
}
