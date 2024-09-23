import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import apiQueue from './queueRequest'; // Assuming you're using the queue system from the previous example

const BACKGROUND_FETCH_TASK = 'background-fetch';

// Define the task that will be executed in the background
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Attempt to process the queue
    await apiQueue.processQueue();
    
    // If the queue was successfully processed, return BackgroundFetch.Result.NewData
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error("Background fetch failed:", error);
    return BackgroundFetch.Result.Failed;
  }
});

// Register the background fetch task
async function registerBackgroundFetchAsync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false, // android only,
      startOnBoot: true, // android only
    });
    console.log("Background fetch registered");
  } catch (err) {
    console.log("Background fetch failed to register:", err);
  }
}

// Unregister the background fetch task
async function unregisterBackgroundFetchAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log("Background fetch unregistered");
  } catch (err) {
    console.log("Background fetch failed to unregister:", err);
  }
}

export { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync };