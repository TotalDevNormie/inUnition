<?php

namespace App\Http\Controllers;

use App\Models\DeletedEntries;
use App\Models\TaskGroup;
use App\Models\TaskStatus;
use Illuminate\Http\Request;

class TaskGroupController extends Controller
{
    public function getTaskGroups(Request $request)
    {
        $taskGroupsQuery = TaskGroup::where('user_id', auth()->user()->id);
        $deletedQuery = DeletedEntries::where('user_id', auth()->user()->id)->where('type', 'taskGroup');

        if (isset($request['timestamp'])) {
            $timestamp = Carbon::parse($request['timestamp']);
            $taskGroupsQuery = $taskGroupsQuery->where('updated_at', '>=', $timestamp);
            $deletedQuery = $deletedQuery->where('updated_at', '>=', $timestamp);
        }

        return response()->json([
            'taskGroups' => $taskGroupsQuery->get(),
            'deleted' => $deletedQuery->get()
        ], 200);

    }

    public function saveTaskGroup(Request $request)
    {
        try {
            $request->validate(['uuid' => 'required|note', 'task_statuses' => 'required|array']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }
    }

    private function save(array $taskGroupInput)
    {
        if (!isset($taskGroupInput['uuid'])) {
            throw new \Exception('Missing uuid');
        }

        $taskGroup = TaskGroup::find($taskGroupInput['uuid']);
        if (!$taskGroup && !DeletedEntries::find($taskGroupInput['uuid'])) {
            $title = isset($taskGroupInput['title']) ? substr($taskGroupInput['title'], 0, 100) : '';
            $content = $taskGroupInput['content'] ?? '';
            $uuid = $taskGroupInput['uuid'];
            $ends_at = $taskGroupInput['ends_at'] ?? null;
            $next_reset = $taskGroupInput['next_reset'] ?? null;
            $reset_interval = $taskGroupInput['reset_interval'] ?? null;
            $updated_at = $taskGroupInput['updated_at'] ?? Carbon::now()->timestamp;
            $created_at = $taskGroupInput['created_at'] ?? Carbon::now()->timestamp;

            TaskGroup::create([
                'title' => $title,
                'content' => $content,
                'uuid' => $uuid,
                'ends_at' => $ends_at,
                'next_reset' => $next_reset,
                'reset_interval' => $reset_interval,
                'user_id' => auth()->user()->id,
                'updated_at' => $updated_at,
                'created_at' => $created_at
            ]);

            $task_statuses = $taskGroupInput['task_statuses'] ?? [];

            foreach ($task_statuses as $task_status) {
                TaskStatus::create([
                    'task_group_uuid' => $taskGroupInput['uuid'],
                    'name' => $task_status
                ]);
            }
        } elseif ($taskGroup) {
            $oldUpdated = $taskGroup->updated_at;
            $newUpdated = $taskGroupInput['updated_at'] ?? 0;
            $isNewer = $oldUpdated < $newUpdated;

            if ($isNewer && isset($taskGroupInput['title'])) {
                $taskGroup->title = substr($taskGroupInput['title'], 0, 100);
            }
            if ($isNewer && isset($taskGroupInput['content'])) {
                $taskGroup->content = $taskGroupInput['content'];
            }

            if ($isNewer && isset($taskGroupInput['ends_at'])) {
                $taskGroup->ends_at = $taskGroupInput['ends_at'];
            }


            if ($isNewer && isset($taskGroupInput['next_reset'])) {
                $taskGroup->next_reset = $taskGroupInput['next_reset'];
            }

            if ($isNewer && isset($taskGroupInput['reset_interval'])) {
                $taskGroup->reset_interval = $taskGroupInput['reset_interval'];
            }

            if ($isNewer && isset($taskGroupInput['task_statuses'])) {

                $task_statuses = $taskGroupInput['task_statuses'] ?? [];

                foreach ($task_statuses as $task_status) {
                    TaskStatus::create([
                        'task_group_uuid' => $taskGroup->uuid,
                        'name' => $task_status
                    ]);
                }
            }

            $taskGroup->save();
        }
    }

    public function deleteTaskGroup(Request $request)
    {
        try {
            $request->validate(['uuid' => 'string']);
        } catch (ValidationException $e) {
            return response()->json($e->errors(), 422);
        }

        Note::find($request->uuid)->delete();
        DeletedEntries::create([
                            'uuid' => $request->uuid,
                            'type' => 'taskGroup',
                            'user_id' => auth()->user()->id
        ]);
        return response()->json(['message' => 'note deleted'], 200);
    }


}
