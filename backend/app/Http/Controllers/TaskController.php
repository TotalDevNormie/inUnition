<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\DeletedEntries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class TaskController extends Controller
{
    public function saveTask(Request $request)
    {
        try {
            $this->save($request->toArray());
        } catch (\Exception $e) {
            return response()->json($e->getMessage(), 422);
        }
        return response()->json(['message' => 'task saved'], 200);
    }

    public function saveTasks(Request $request)
    {
        try {
            $request->validate(['tasks' => 'array']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }

        foreach ($request->tasks as $task) {
            try {
                $this->save($task);
            } catch (\Exception $e) {
                return response()->json($e->getMessage(), 422);
            }
        }

        return response()->json(['message' => 'tasks saved'], 200);
    }

    public function getTasks(Request $request)
    {
        $tasksQuery = Task::where('user_id', auth()->user()->id);
        $deletedQuery = DeletedEntries::where('user_id', auth()->user()->id)->where('type', 'task');

        if (isset($request['timestamp'])) {
            $timestamp = Carbon::parse($request['timestamp']);
            $tasksQuery = $tasksQuery->where('updated_at', '>=', $timestamp);
            $deletedQuery = $deletedQuery->where('updated_at', '>=', $timestamp);
        }

        return response()->json([
            'tasks' => $tasksQuery->get(),
            'deleted' => $deletedQuery->get()
        ], 200);
    }

    private function save(array $taskInput)
    {
        if (!isset($taskInput['uuid'])) {
            throw new \Exception('Missing uuid');
        }

        $task = Task::find($taskInput['uuid']);

        if (!$task && !DeletedEntries::find($taskInput['uuid'])) {
            $name = substr($taskInput['name'] ?? '', 0, 50);
            $description = substr($taskInput['description'] ?? '', 0, 200);
            $uuid = $taskInput['uuid'];
            $status = $taskInput['status'] ?? 'pending';
            $taskGroupUuid = $taskInput['task_group_uuid'];
            $ends_at = isset($taskInput['ends_at']) ? Carbon::parse($taskInput['ends_at']) : null;

            $updated_at = isset($taskInput['updated_at']) ? Carbon::parse($taskInput['updated_at']) : Carbon::now();
            $created_at = isset($taskInput['created_at']) ? Carbon::parse($taskInput['created_at']) : Carbon::now();

            Task::create([
                'name' => $name,
                'description' => $description,
                'uuid' => $uuid,
                'status' => $status,
                'task_group_uuid' => $taskGroupUuid,
                'user_id' => auth()->user()->id,
                'updated_at' => $updated_at,
                'created_at' => $created_at
            ]);
        } elseif ($task) {
            $oldUpdated = $task->updated_at->timestamp;
            $newUpdated = isset($taskInput['updated_at']) ? Carbon::parse($taskInput['updated_at'])->timestamp : 0;

            $isNewer = $oldUpdated <= $newUpdated;

            if ($isNewer) {
                if (isset($taskInput['name'])) {
                    $task->name = substr($taskInput['name'], 0, 50);
                }
                if (isset($taskInput['description'])) {
                    $task->description = substr($taskInput['description'], 0, 200);
                }
                if (isset($taskInput['status'])) {
                    $task->status = $taskInput['status'];
                }
                if (isset($taskInput['ends_at'])) {
                    $task->ends_at = Carbon::parse($taskInput['ends_at']);
                }
                $task->updated_at = Carbon::parse($taskInput['updated_at']);
                $task->save();
            }
        }
    }

    public function deleteTask(Request $request)
    {
        try {
            $request->validate(['uuid' => 'string']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }

        try {
            $task = Task::find($request->uuid);
            if (!$task) {
                return response()->json(['error' => 'Task not found'], 422);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Task not found'], 422);
        }
        Task::find($request->uuid)->delete();
        DeletedEntries::create([
            'uuid' => $request->uuid,
            'type' => 'task',
            'user_id' => auth()->user()->id
        ]);
        return response()->json(['message' => 'task deleted'], 200);
    }
}
