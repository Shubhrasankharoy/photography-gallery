import { FirestoreQueueProvider } from './firestoreQueueProvider';

class QueueFactory {
  constructor() {
    this.provider = new FirestoreQueueProvider();
  }

  getProvider() {
    return this.provider;
  }
}

export const queueFactory = new QueueFactory();
export default queueFactory;
