import { FirestoreShareProvider } from './firestoreShareProvider';
import { ShareService } from './shareService';

let shareServiceInstance = null;

export function getShareService() {
  if (!shareServiceInstance) {
    const provider = new FirestoreShareProvider();
    shareServiceInstance = new ShareService(provider);
  }
  return shareServiceInstance;
}
