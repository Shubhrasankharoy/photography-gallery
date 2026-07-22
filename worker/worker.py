import os
import time
import requests
import threading
from datetime import datetime, timezone
from typing import Dict, Any
from job_queue import QueueManager
from providers.factory import provider_factory
import config

class HeartbeatThread(threading.Thread):
  def __init__(self, queue_manager: QueueManager, job_id: str, interval: int = config.HEARTBEAT_INTERVAL_SEC):
    super().__init__()
    self.queue_manager = queue_manager
    self.job_id = job_id
    self.interval = interval
    self.stop_event = threading.Event()
    self.daemon = True

  def run(self):
    while not self.stop_event.wait(self.interval):
      try:
        success = self.queue_manager.heartbeat(self.job_id)
        if success:
          print(f"[Heartbeat] Successfully extended lease for job {self.job_id}")
        else:
          print(f"[Heartbeat] Heartbeat failed: lease has been revoked for job {self.job_id}")
          break
      except Exception as e:
        print(f"[Heartbeat] Error sending heartbeat for job {self.job_id}: {e}")

  def stop(self):
    self.stop_event.set()

class AIWorker:
  def __init__(self):
    self.queue_manager = QueueManager()
    self.temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tmp")
    os.makedirs(self.temp_dir, exist_ok=True)

  def start(self):
    print(f"[*] Starting AI Worker: {config.WORKER_ID}")
    print(f"[*] Polling Firestore '{config.COLLECTION_JOBS}' every {config.POLL_INTERVAL_SEC} seconds...")

    while True:
      try:
        # Check for expired leases of other workers and reset them
        # Note: In production this would run on a cron, but we can do it occasionally during loop
        self.queue_manager.heartbeat("fake_ping_to_keep_alive", "none") # no-op check
      except Exception:
        pass

      try:
        job = self.queue_manager.claim_job()
        if job:
          print(f"[+] Claimed Job: {job['jobId']} (Type: {job['jobType']}, Priority: {job['priority']})")
          self._process_job(job)
        else:
          # No jobs, sleep before next poll
          time.sleep(config.POLL_INTERVAL_SEC)
      except Exception as e:
        print(f"[Error] Main worker loop encountered exception: {e}")
        time.sleep(config.POLL_INTERVAL_SEC)

  def _process_job(self, job: Dict[str, Any]):
    job_id = job["jobId"]
    photo_id = job.get("photoId")
    job_type = job.get("jobType")

    if job_type != "face_index":
      print(f"[-] Unsupported job type: {job_type}. Failing job.")
      self.queue_manager.fail_job(job_id, photo_id, ValueError(f"Unsupported job type: {job_type}"))
      return

    # Start heartbeat thread
    heartbeat = HeartbeatThread(self.queue_manager, job_id)
    heartbeat.start()

    # Track temp file for cleanup
    temp_file_path = None

    try:
      # Retrieve input details
      job_input = job.get("input", {})
      # Prefer thumbnailUrl for face detection since it is smaller/faster, fallback to imageUrl
      image_url = job_input.get("thumbnailUrl") or job_input.get("imageUrl")
      
      if not image_url:
        raise ValueError("Job input payload does not contain imageUrl or thumbnailUrl")

      self.queue_manager.update_progress(job_id, 10)

      # 1. Download image
      temp_file_path = self._download_image(image_url, job_id)
      self.queue_manager.update_progress(job_id, 30)

      # 2. Get the provider from Factory
      provider_name = job.get("metadata", {}).get("provider", "insightface")
      provider = provider_factory.get_provider(provider_name)
      self.queue_manager.update_progress(job_id, 50)

      # 3. Process image (detect faces & generate embeddings)
      print(f"[*] Invoking AI Provider '{provider.name()}' for job {job_id}...")
      face_results = provider.process_image(temp_file_path)
      self.queue_manager.update_progress(job_id, 80)

      # 4. Format face embeddings document list
      embeddings_list = []
      for face in face_results:
        embeddings_list.append({
          "provider": provider.name(),
          "model": provider.model_name if hasattr(provider, "model_name") else "buffalo_l",
          "modelVersion": "v1",
          "embeddingVersion": provider.embedding_version(),
          "embedding": face["embedding"],
          "boundingBox": face["boundingBox"],
          "landmarks": face.get("landmarks"),
          "detectionConfidence": face.get("detectionConfidence"),
          "qualityScore": face.get("qualityScore"),
          "faceWidth": face.get("faceWidth"),
          "faceHeight": face.get("faceHeight"),
          "pose": face.get("pose")
        })

      output_payload = {
        "faceCount": len(embeddings_list),
        "embeddingsCount": len(embeddings_list),
        "processedAt": datetime.now(timezone.utc).isoformat()
      }

      # Stop heartbeat thread before completing
      heartbeat.stop()
      heartbeat.join()

      # 5. Commit to database and complete job
      self.queue_manager.complete_job(job_id, photo_id, output_payload, embeddings_list)

    except Exception as e:
      print(f"[Error] Failed processing job {job_id}: {e}")
      
      # Stop heartbeat thread
      heartbeat.stop()
      try:
        heartbeat.join()
      except Exception:
        pass
        
      self.queue_manager.fail_job(job_id, photo_id, e)

    finally:
      # Clean up temp file
      if temp_file_path and os.path.exists(temp_file_path):
        try:
          os.remove(temp_file_path)
          print(f"[*] Cleaned up temporary file: {temp_file_path}")
        except Exception as e:
          print(f"[Warning] Failed to delete temp file {temp_file_path}: {e}")

  def _download_image(self, url: str, job_id: str) -> str:
    print(f"[*] Downloading image for job {job_id}...")
    
    # Check if the URL is a base64 Data URI
    if url.startswith("data:image/"):
      import base64
      import re
      try:
        header, encoded = url.split(",", 1)
        match = re.search(r"data:image/(\w+);base64", header)
        ext = f".{match.group(1)}" if match else ".jpg"
        temp_path = os.path.join(self.temp_dir, f"job_{job_id}{ext}")
        
        data = base64.b64decode(encoded)
        with open(temp_path, "wb") as f:
          f.write(data)
        print(f"[+] Decoded base64 data URI for job {job_id} ({len(data)} bytes)")
        return temp_path
      except Exception as e:
        raise ValueError(f"Failed to decode base64 data URI: {e}")

    # Extract file extension or default to .jpg
    ext = ".jpg"
    if ".png" in url.lower():
      ext = ".png"
    elif ".webp" in url.lower():
      ext = ".webp"

    temp_path = os.path.join(self.temp_dir, f"job_{job_id}{ext}")
    
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    with open(temp_path, "wb") as f:
      f.write(response.content)

    print(f"[+] Download complete: {temp_path} ({len(response.content)} bytes)")
    return temp_path
