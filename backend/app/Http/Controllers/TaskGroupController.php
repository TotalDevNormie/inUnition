<?php

namespace App\Http\Controllers;

use App\Models\DeletedEntries;
use App\Models\TaskGroup;
use App\Models\TaskStatus;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskGroupController extends Controller
{
    public function getTaskGroups(Request $request)
    {
        $taskGroupsQuery = TaskGroup::where('user_id', auth()->user()->id);
        $deletedQuery = DeletedEntries::where('user_id', auth()->user()->id)
            ->where('type', 'taskGroup');

        if (isset($request['timestamp'])) {
            $timestamp = Carbon::parse($request['timestamp']);
            $taskGroupsQuery = $taskGroupsQuery->where('updated_at', '>=', $timestamp);
            $deletedQuery = $deletedQuery->where('updated_at', '>=', $timestamp);
        }

        $taskGroups = [];

        foreach ($taskGroupsQuery->get() as $taskGroup) {
            $taskGroupArray = $taskGroup->toArray();
            $taskGroups[] = [
                ...$taskGroupArray,
                'task_statuses' => json_decode($taskGroupArray['task_statuses']),
            ];
        }

        return response()->json([
            'taskGroups' => $taskGroups,
            'deleted' => $deletedQuery->get()
        ], 200);
    }

    public function saveTaskGroup(Request $request)
    {
        try {
            $validated = $request->validate([
                'uuid' => 'required|uuid',
                'task_statuses' => 'nullable|array',
                'name' => 'nullable|string',
                'description' => 'nullable|string',
                'ends_at' => 'nullable|date',
                'next_reset' => 'nullable|date',
                'reset_interval' => 'nullable|integer',
                'updated_at' => 'nullable|date',
                'created_at' => 'nullable|date'
            ]);

            DB::beginTransaction();
            $this->save($validated);
            DB::commit();

            return response()->json(['message' => 'Task group saved successfully'], 200);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to save task group: ' . $e->getMessage()], 500);
        }
    }

    private function save(array $taskGroupInput)
    {
        if (!isset($taskGroupInput['uuid'])) {
            throw new \Exception('Missing uuid');
        }

        $taskGroup = TaskGroup::where('uuid', $taskGroupInput['uuid'])->first();
        $isDeleted = DeletedEntries::where('uuid', $taskGroupInput['uuid'])->exists();

        if (!$taskGroup && !$isDeleted) {
            // Create new task group
            $taskGroup = TaskGroup::create([
                'name' => substr($taskGroupInput['name'] ?? '', 0, 50),
                'description' => substr($taskGroupInput['description'] ?? '', 0, 200),
                'uuid' => $taskGroupInput['uuid'],
                'task_statuses' => json_encode($taskGroupInput['task_statuses']) ?? '["Todo", "Doing", "Done"]',
                'ends_at' => $taskGroupInput['ends_at'] ?? null,
                'next_reset' => $taskGroupInput['next_reset'] ?? null,
                'reset_interval' => $taskGroupInput['reset_interval'] ?? null,
                'user_id' => auth()->id(),
                'updated_at' => $taskGroupInput['updated_at'] ?? Carbon::now()->toISOString(),
                'created_at' => $taskGroupInput['created_at'] ?? Carbon::now()->toISOString(),
            ]);

        } elseif ($taskGroup) {
            $oldUpdated = $taskGroup->updated_at;
            $newUpdated = $taskGroupInput['updated_at'] ?? 0;

            if ($oldUpdated <= $newUpdated) {
                $this->updateTaskGroup($taskGroup, $taskGroupInput);
            }
        }

        return $taskGroup;
    }

    private function updateTaskGroup(TaskGroup $taskGroup, array $input)
    {
        if (isset($input['name'])) {
            $taskGroup->name = substr($input['name'], 0, 50);
        }
        if (isset($input['description'])) {
            $taskGroup->description = substr($input['description'], 0, 200);

        }
        if (isset($input['task_statuses'])) {
            $taskGroup->task_statuses = json_encode($input['task_statuses']);
        }

        if (isset($input['ends_at'])) {
            $taskGroup->ends_at = $input['ends_at'] ? Carbon::parse($input['ends_at']) : null;
        }
        if (isset($input['next_reset'])) {
            $taskGroup->next_reset = $input['next_reset'];
        }
        if (isset($input['reset_interval'])) {
            $taskGroup->reset_interval = $input['reset_interval'];
        }

        $taskGroup->save();
    }
    public function deleteTaskGroup(Request $request)
    {
        try {
            $request->validate(['uuid' => 'required|uuid']);

            $taskGroup = TaskGroup::find($request->uuid);

            if (!$taskGroup) {
                return response()->json(['error' => 'Task group not found'], 404);
            }

            DB::beginTransaction();

            try {
                // Find all tasks associated with the task group
                $tasks = $taskGroup->tasks;

                // Delete the task group
                $taskGroup->delete();

                // Log the deleted task group in DeletedEntries
                DeletedEntries::create([
                    'uuid' => $request->uuid,
                    'type' => 'taskGroup',
                    'user_id' => auth()->user()->id,
                    'updated_at' => Carbon::now()
                ]);

                // Log each associated task in DeletedEntries
                foreach ($tasks as $task) {
                    DeletedEntries::create([
                        'uuid' => $task->uuid,
                        'type' => 'task',
                        'user_id' => auth()->user()->id,
                        'updated_at' => Carbon::now()
                    ]);

                    // Delete the task
                    $task->delete();
                }

                DB::commit();
                return response()->json(['message' => 'Task group and associated tasks deleted successfully'], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json(['error' => 'Failed to delete task group and tasks: ' . $e->getMessage()], 500);
            }

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }


}
