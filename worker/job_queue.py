import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import Transaction
from datetime import datetime, timezone, timedelta
import config

db = None

def init_firebase():
  global db
  if not firebase_admin._apps:
    if config.FIREBASE_SERVICE_ACCOUNT_KEY:
      cred = credentials.Certificate(config.FIREBASE_SERVICE_ACCOUNT_KEY)
      firebase_admin.initialize_app(cred)
    else:
      # Automatically detect credentials from GCP environment or default
      firebase_admin.initialize_app()
  db = firestore.client()
  print("[Firebase] SDK initialized successfully.")

def get_db():
  global db
  if db is None:
    init_firebase()
  return db

class QueueManager:
  def __init__(self, worker_id=config.WORKER_ID):
    self.db = get_db()
    self.worker_id = worker_id

  def claim_job(self) -> dict or None:
    transaction = self.db.transaction()
    return self._claim_transaction(transaction, self.db, self.worker_id)

  @staticmethod
  @firestore.transactional
  def _claim_transaction(transaction, db_client, worker_id) -> dict or None:
    jobs_ref = db_client.collection(config.COLLECTION_JOBS)
    
    # 1. Query pending jobs (ordered by priority ASC, createdAt ASC)
    pending_query = jobs_ref.where("status", "==", "pending").order_by("priority").order_by("createdAt").limit(1)
    pending_docs = list(pending_query.get(transaction=transaction))
    
    candidate_doc = None
    if len(pending_docs) > 0:
      candidate_doc = pending_docs[0]
    else:
      # 2. Query expired running jobs
      now = datetime.now(timezone.utc)
      expired_query = jobs_ref.where("status", "==", "running").where("leaseExpiresAt", "<", now).limit(1)
      expired_docs = list(expired_query.get(transaction=transaction))
      if len(expired_docs) > 0:
        candidate_doc = expired_docs[0]

    if not candidate_doc:
      return None

    doc_ref = jobs_ref.document(candidate_doc.id)
    job_data = candidate_doc.to_dict()

    # Double check state
    if job_data.get("status") not in ["pending", "running"]:
      return None

    lease_expires = datetime.now(timezone.utc) + timedelta(seconds=config.LEASE_DURATION_SEC)
    
    updates = {
      "status": "running",
      "workerId": worker_id,
      "leaseExpiresAt": lease_expires,
      "heartbeatAt": firestore.SERVER_TIMESTAMP,
      "startedAt": job_data.get("startedAt") or firestore.SERVER_TIMESTAMP,
      "updatedAt": firestore.SERVER_TIMESTAMP
    }

    transaction.update(doc_ref, updates)
    
    # Prepare serializable return object
    result = {}
    result.update(job_data)
    result.update(updates)
    result["leaseExpiresAt"] = lease_expires
    result["jobId"] = candidate_doc.id
    return result

  def update_progress(self, job_id: str, progress: int):
    try:
      doc_ref = self.db.collection(config.COLLECTION_JOBS).document(job_id)
      doc_ref.update({
        "progress": progress,
        "updatedAt": firestore.SERVER_TIMESTAMP
      })
    except Exception as e:
      print(f"[QueueManager] Failed to update progress for job {job_id}: {e}")

  def heartbeat(self, job_id: str) -> bool:
    transaction = self.db.transaction()
    return self._heartbeat_transaction(transaction, self.db, job_id, self.worker_id)

  @staticmethod
  @firestore.transactional
  def _heartbeat_transaction(transaction, db_client, job_id, worker_id) -> bool:
    doc_ref = db_client.collection(config.COLLECTION_JOBS).document(job_id)
    snapshot = doc_ref.get(transaction=transaction)
    if not snapshot.exists:
      return False

    job_data = snapshot.to_dict()
    if job_data.get("status") != "running" or job_data.get("workerId") != worker_id:
      return False

    lease_expires = datetime.now(timezone.utc) + timedelta(seconds=config.LEASE_DURATION_SEC)
    transaction.update(doc_ref, {
      "leaseExpiresAt": lease_expires,
      "heartbeatAt": firestore.SERVER_TIMESTAMP,
      "updatedAt": firestore.SERVER_TIMESTAMP
    })
    return True

  def complete_job(self, job_id: str, photo_id: str, output: dict, embeddings: list):
    try:
      # 1. Fetch photo data first to get eventId/studioId
      photo_ref = self.db.collection(config.COLLECTION_PHOTOS).document(photo_id)
      photo_snap = photo_ref.get()
      if not photo_snap.exists:
        raise ValueError(f"Photo {photo_id} not found in database.")

      photo_data = photo_snap.to_dict()
      event_id = photo_data.get("eventId")
      studio_id = photo_data.get("studioId")

      # 2. Delete any existing embeddings for this photo to avoid duplicates
      existing_embeddings = self.db.collection(config.COLLECTION_EMBEDDINGS).where("photoId", "==", photo_id).get()
      batch = self.db.batch()
      for doc_snap in existing_embeddings:
        batch.delete(doc_snap.reference)
      batch.commit()

      # 3. Batch write new embeddings
      batch = self.db.batch()
      embedding_ids = []
      for i, emb_data in enumerate(embeddings):
        emb_id = f"{photo_id}_{i}"
        emb_ref = self.db.collection(config.COLLECTION_EMBEDDINGS).document(emb_id)
        
        embedding_doc = {
          "embeddingId": emb_id,
          "photoId": photo_id,
          "eventId": event_id,
          "studioId": studio_id,
          "personId": None,
          "regionIndex": i,
          "faceIndex": i,
          "provider": emb_data.get("provider", "insightface"),
          "model": emb_data.get("model", "buffalo_l"),
          "modelVersion": emb_data.get("modelVersion", "v1"),
          "embeddingVersion": emb_data.get("embeddingVersion", "buffalo_l_512_v1"),
          "embeddingLength": len(emb_data.get("embedding")),
          "embedding": emb_data.get("embedding"),
          "normalized": True,
          "boundingBox": emb_data.get("boundingBox"),
          "landmarks": emb_data.get("landmarks"),
          "detectionConfidence": emb_data.get("detectionConfidence", 1.0),
          "qualityScore": emb_data.get("qualityScore", 1.0),
          "faceWidth": emb_data.get("faceWidth"),
          "faceHeight": emb_data.get("faceHeight"),
          "pose": emb_data.get("pose"),
          "createdAt": firestore.SERVER_TIMESTAMP,
          "updatedAt": firestore.SERVER_TIMESTAMP,
          "status": "active"
        }
        batch.set(emb_ref, embedding_doc)
        embedding_ids.append(emb_id)
      batch.commit()

      # 4. Update the job as completed
      job_ref = self.db.collection(config.COLLECTION_JOBS).document(job_id)
      job_ref.update({
        "status": "completed",
        "progress": 100,
        "output": output,
        "completedAt": firestore.SERVER_TIMESTAMP,
        "workerId": None,
        "leaseExpiresAt": None,
        "heartbeatAt": None,
        "updatedAt": firestore.SERVER_TIMESTAMP
      })

      # 5. Update the photo indexing status
      photo_ref.update({
        "faceIndexStatus": "completed",
        "embeddingVersion": embeddings[0].get("embeddingVersion") if embeddings else "buffalo_l_512_v1",
        "faceIndexError": None,
        "updatedAt": firestore.SERVER_TIMESTAMP
      })

      # 6. Update event statistics
      if event_id:
        event_ref = self.db.collection("events").document(event_id)
        event_ref.update({
          "faceCount": firestore.Increment(len(embeddings)),
          "indexedPhotos": firestore.Increment(1),
          "indexVersion": embeddings[0].get("embeddingVersion") if embeddings else "buffalo_l_512_v1",
          "lastIndexedAt": firestore.SERVER_TIMESTAMP
        })

      # Log to timeline
      self.log_timeline(
        studio_id=studio_id,
        event_id=event_id,
        resource_type="photo",
        resource_id=photo_id,
        action="ai_job_completed",
        title="AI Indexing Completed",
        description=f"Background face indexing completed for photo. Detected {len(embeddings)} face(s).",
        severity="success"
      )

      print(f"[QueueManager] Job {job_id} completed successfully. Indexed {len(embeddings)} faces.")
    except Exception as e:
      print(f"[QueueManager] Failed to complete job {job_id}: {e}")
      self.fail_job(job_id, photo_id, e)

  def fail_job(self, job_id: str, photo_id: str, error: Exception):
    try:
      # Fetch photo data first to get eventId/studioId
      photo_ref = self.db.collection(config.COLLECTION_PHOTOS).document(photo_id)
      photo_snap = photo_ref.get()
      event_id = None
      studio_id = None
      if photo_snap.exists:
        photo_data = photo_snap.to_dict()
        event_id = photo_data.get("eventId")
        studio_id = photo_data.get("studioId")

      job_ref = self.db.collection(config.COLLECTION_JOBS).document(job_id)
      
      # Atomic update of attempts and status using transaction
      transaction = self.db.transaction()
      is_dead, next_attempts = self._fail_transaction(transaction, self.db, job_id, str(error))

      if is_dead:
        # Mark photo status as failed
        photo_ref.update({
          "faceIndexStatus": "failed",
          "faceIndexError": str(error),
          "updatedAt": firestore.SERVER_TIMESTAMP
        })
        # Increment index count even if failed, to maintain progress ratio
        if event_id:
          event_ref = self.db.collection("events").document(event_id)
          event_ref.update({
            "indexedPhotos": firestore.Increment(1),
            "lastIndexedAt": firestore.SERVER_TIMESTAMP
          })

        self.log_timeline(
          studio_id=studio_id,
          event_id=event_id,
          resource_type="photo",
          resource_id=photo_id,
          action="ai_job_failed",
          title="AI Indexing Failed (DLQ)",
          description=f"Job {job_id} failed after maximum attempts: {str(error)}",
          severity="error"
        )
      else:
        # Log temporary failure
        self.log_timeline(
          studio_id=studio_id,
          event_id=event_id,
          resource_type="photo",
          resource_id=photo_id,
          action="ai_job_failed",
          title="AI Indexing Attempt Failed",
          description=f"Job {job_id} failed (attempt {next_attempts}): {str(error)}",
          severity="warning"
        )

      print(f"[QueueManager] Job {job_id} failed (dead={is_dead}): {error}")
    except Exception as e:
      print(f"[QueueManager] Error during fail_job sequence for job {job_id}: {e}")

  @staticmethod
  @firestore.transactional
  def _fail_transaction(transaction, db_client, job_id, error_msg) -> tuple:
    doc_ref = db_client.collection(config.COLLECTION_JOBS).document(job_id)
    snapshot = doc_ref.get(transaction=transaction)
    if not snapshot.exists:
      return False, 0

    job_data = snapshot.to_dict()
    next_attempts = (job_data.get("attempts") or 0) + 1
    max_attempts = job_data.get("maxAttempts") or 3
    is_dead = next_attempts >= max_attempts

    updates = {
      "attempts": next_attempts,
      "lastError": error_msg,
      "status": "dead" if is_dead else "pending",
      "workerId": None,
      "leaseExpiresAt": None,
      "heartbeatAt": None,
      "updatedAt": firestore.SERVER_TIMESTAMP
    }

    if is_dead:
      updates["completedAt"] = firestore.SERVER_TIMESTAMP

    transaction.update(doc_ref, updates)
    return is_dead, next_attempts

  def log_timeline(self, studio_id, event_id, resource_type, resource_id, action, title, description, severity):
    try:
      timeline_ref = self.db.collection(config.COLLECTION_TIMELINE).document()
      timeline_ref.set({
        "activityId": timeline_ref.id,
        "studioId": studio_id,
        "eventId": event_id,
        "resourceType": resource_type,
        "resourceId": resource_id,
        "action": action,
        "actorId": "system",
        "actorName": "AI Worker",
        "title": title,
        "description": description,
        "severity": severity,
        "source": "system",
        "status": "active",
        "createdAt": firestore.SERVER_TIMESTAMP
      })
    except Exception as e:
      print(f"[QueueManager] Failed to log timeline activity: {e}")
