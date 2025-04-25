import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';

const PROJECT_ID = 'firestore-rules-test';
const RULES_FILE = 'firestore.rules'; // Make sure your rules file is named this or update the path

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_FILE, 'utf8'),
      host: 'localhost', // Or the host where your emulator is running
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {
  const uid = 'test-user';
  const anotherUid = 'another-user';

  describe('Notes Collection', () => {
    it('allows authenticated users to create notes with their UID', async () => {
      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();

      await assertSucceeds(
        authenticatedDb.collection('notes').add({
          title: 'Test Note',
          content: 'This is a test note',
          userUid: uid,
        })
      );
    });

    it("prevents users from creating notes with another user's UID", async () => {
      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();

      await assertFails(
        authenticatedDb.collection('notes').add({
          title: 'Test Note',
          content: 'This is a test note',
          userUid: anotherUid,
        })
      );
    });

    it('prevents unauthenticated users from creating notes', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        unauthenticatedDb.collection('notes').add({
          title: 'Test Note',
          content: 'This is a test note',
          userUid: uid,
        })
      );
    });

    it('allows users to read their own notes', async () => {
      // Setup: Create a note with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('notes').doc('note1').set({
          title: 'My Note',
          content: 'Private content',
          userUid: uid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertSucceeds(authenticatedDb.collection('notes').doc('note1').get());
    });

    it("prevents users from reading others' notes", async () => {
      // Setup: Create a note with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('notes').doc('note2').set({
          title: "Another User's Note",
          content: 'Private content',
          userUid: anotherUid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertFails(authenticatedDb.collection('notes').doc('note2').get());
    });

    it('allows users to update their own notes', async () => {
      // Setup: Create a note with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('notes').doc('note3').set({
          title: 'Original Title',
          content: 'Original content',
          userUid: uid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertSucceeds(
        authenticatedDb.collection('notes').doc('note3').update({ title: 'Updated Title' })
      );
    });

    it("prevents users from updating others' notes", async () => {
      // Setup: Create a note with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('notes').doc('note4').set({
          title: "Another User's Note",
          content: 'Private content',
          userUid: anotherUid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertFails(
        authenticatedDb.collection('notes').doc('note4').update({ title: 'Attempted Update' })
      );
    });
  });

  describe('Tasks Collection', () => {
    it('allows authenticated users to create tasks with their UID', async () => {
      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();

      await assertSucceeds(
        authenticatedDb.collection('tasks').add({
          title: 'Test Task',
          completed: false,
          userUid: uid,
        })
      );
    });

    it("prevents users from creating tasks with another user's UID", async () => {
      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();

      await assertFails(
        authenticatedDb.collection('tasks').add({
          title: 'Test Task',
          completed: false,
          userUid: anotherUid,
        })
      );
    });

    it('prevents unauthenticated users from creating tasks', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        unauthenticatedDb.collection('tasks').add({
          title: 'Test Task',
          completed: false,
          userUid: uid,
        })
      );
    });

    it('allows users to read their own tasks', async () => {
      // Setup: Create a task with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('tasks').doc('task1').set({
          title: 'My Task',
          completed: false,
          userUid: uid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertSucceeds(authenticatedDb.collection('tasks').doc('task1').get());
    });

    it("prevents users from reading others' tasks", async () => {
      // Setup: Create a task with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('tasks').doc('task2').set({
          title: "Another User's Task",
          completed: false,
          userUid: anotherUid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertFails(authenticatedDb.collection('tasks').doc('task2').get());
    });

    it('allows users to update their own tasks', async () => {
      // Setup: Create a task with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('tasks').doc('task3').set({
          title: 'Original Task',
          completed: false,
          userUid: uid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertSucceeds(
        authenticatedDb.collection('tasks').doc('task3').update({ completed: true })
      );
    });

    it("prevents users from updating others' tasks", async () => {
      // Setup: Create a task with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('tasks').doc('task4').set({
          title: "Another User's Task",
          completed: false,
          userUid: anotherUid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertFails(
        authenticatedDb.collection('tasks').doc('task4').update({ completed: true })
      );
    });
  });

  describe('Task Boards Collection', () => {
    it('allows authenticated users to create task boards with their UID', async () => {
      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();

      await assertSucceeds(
        authenticatedDb.collection('taskBoards').add({
          name: 'Test Board',
          userUid: uid,
        })
      );
    });

    it("prevents users from creating task boards with another user's UID", async () => {
      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();

      await assertFails(
        authenticatedDb.collection('taskBoards').add({
          name: 'Test Board',
          userUid: anotherUid,
        })
      );
    });

    it('prevents unauthenticated users from creating task boards', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        unauthenticatedDb.collection('taskBoards').add({
          name: 'Test Board',
          userUid: uid,
        })
      );
    });

    it('allows users to read their own task boards', async () => {
      // Setup: Create a task board with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('taskBoards').doc('board1').set({
          name: 'My Board',
          userUid: uid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertSucceeds(authenticatedDb.collection('taskBoards').doc('board1').get());
    });

    it("prevents users from reading others' task boards", async () => {
      // Setup: Create a task board with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('taskBoards').doc('board2').set({
          name: "Another User's Board",
          userUid: anotherUid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertFails(authenticatedDb.collection('taskBoards').doc('board2').get());
    });

    it('allows users to update their own task boards', async () => {
      // Setup: Create a task board with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('taskBoards').doc('board3').set({
          name: 'Original Board',
          userUid: uid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertSucceeds(
        authenticatedDb.collection('taskBoards').doc('board3').update({ name: 'Updated Board' })
      );
    });

    it("prevents users from updating others' task boards", async () => {
      // Setup: Create a task board with a specific UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('taskBoards').doc('board4').set({
          name: "Another User's Board",
          userUid: anotherUid,
        });
      });

      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      await assertFails(
        authenticatedDb.collection('taskBoards').doc('board4').update({ name: 'Attempted Update' })
      );
    });
  });

  describe('Other Collections', () => {
    it('prevents any read or write operations on other collections', async () => {
      const authenticatedDb = testEnv.authenticatedContext(uid).firestore();
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();

      // Attempt to create
      await assertFails(authenticatedDb.collection('randomCollection').add({ data: 'test' }));
      await assertFails(unauthenticatedDb.collection('randomCollection').add({ data: 'test' }));

      // Attempt to read
      await assertFails(authenticatedDb.collection('randomCollection').get());
      await assertFails(unauthenticatedDb.collection('randomCollection').get());

      // Attempt to update (need to create a doc first with disabled rules)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('randomCollection').doc('doc1').set({ data: 'original' });
      });

      await assertFails(
        authenticatedDb.collection('randomCollection').doc('doc1').update({ data: 'updated' })
      );
      await assertFails(
        unauthenticatedDb.collection('randomCollection').doc('doc1').update({ data: 'updated' })
      );

      // Attempt to delete (need to create a doc first with disabled rules)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('randomCollection').doc('doc2').set({ data: 'to delete' });
      });
      // Even though you have soft deletes in your application logic, the security
      // rules still deny the *hard* delete operation.
      await assertFails(authenticatedDb.collection('randomCollection').doc('doc2').delete());
      await assertFails(unauthenticatedDb.collection('randomCollection').doc('doc2').delete());
    });
  });
});
