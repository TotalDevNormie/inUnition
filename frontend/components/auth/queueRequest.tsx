import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class ApiQueue {
    queue: Array<() => Promise<void>>;
    isProcessing: boolean;
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async addToQueue(apiCall: () => Promise<void>) {
    this.queue.push(apiCall);
    await this.saveQueue();
    this.processQueue();
  }

  async saveQueue() {
    try {
      await AsyncStorage.setItem('apiQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem('apiQueue');
      if (queueData) {
        this.queue = JSON.parse(queueData) as Array<() => Promise<void>>;
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    if (!isConnected) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const apiCall = this.queue.shift()!;
      try {
        await apiCall();
      } catch (error) {
        console.error('Error processing API call:', error);
        this.queue.unshift(apiCall);
        break;
      }
    }

    await this.saveQueue();
    this.isProcessing = false;
  }
}

export default new ApiQueue();