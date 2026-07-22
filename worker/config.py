import os
import uuid

# Unique identifier for this worker instance
WORKER_ID = os.environ.get("WORKER_ID", f"worker_{uuid.uuid4().hex[:8]}")

# Firestore collection names
COLLECTION_JOBS = "faceIndexJobs"
COLLECTION_EMBEDDINGS = "faceEmbeddings"
COLLECTION_PHOTOS = "photos"
COLLECTION_TIMELINE = "activityTimeline"

# Polling and lease settings
POLL_INTERVAL_SEC = 5       # Time to wait between polling cycles when idle
LEASE_DURATION_SEC = 120    # 2 minutes lease for active jobs
HEARTBEAT_INTERVAL_SEC = 30 # Heartbeat sent every 30 seconds

# Firebase Admin SDK connection configuration
# If local, path to service account json key file (optional, admin sdk auto-detects if GOOGLE_APPLICATION_CREDENTIALS set)
FIREBASE_SERVICE_ACCOUNT_KEY = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
