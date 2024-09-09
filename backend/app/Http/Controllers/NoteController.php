<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Models\Note;

class NoteController extends Controller
{
    /**
     * Get all notes for the current user
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function getNotes(Request $request) {
        $notes = Note::where('user_id', $request->user()->id)->get();
        return response()->json(['notes' => $notes]);
    }
}
