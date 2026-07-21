import { FirestoreRecoveryProvider } from './firestoreRecoveryProvider';
import { RecoveryService } from './recoveryService';

let providerInstance = null;
let serviceInstance = null;

export function getRecoveryProvider() {
  if (!providerInstance) {
    providerInstance = new FirestoreRecoveryProvider();
  }
  return providerInstance;
}

export function getRecoveryService() {
  if (!serviceInstance) {
    serviceInstance = new RecoveryService(getRecoveryProvider());
  }
  return serviceInstance;
}
