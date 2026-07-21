import { FirestoreTimelineProvider } from './firestoreTimelineProvider';

let instance = null;

export function getTimelineProvider() {
  if (!instance) {
    instance = new FirestoreTimelineProvider();
  }
  return instance;
}

export function createTimelineProvider() {
  return new FirestoreTimelineProvider();
}
