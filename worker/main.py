import os
import time
import threading
import numpy as np
from flask import Flask, request, jsonify
from job_queue import init_firebase, get_db
from worker import AIWorker
from providers.insightface_provider import InsightFaceProvider
import config

app = Flask(__name__)

# Initialize InsightFace provider globally so it is loaded once on startup
provider = InsightFaceProvider()

# Global metrics tracking
START_TIME = time.time()
metrics_data = {
  "jobs_processed": 0,
  "total_faces_detected": 0,
  "total_inference_time_ms": 0,
}
metrics_lock = threading.Lock()

# Auth Bearer Token
BEARER_TOKEN = os.environ.get("WORKER_BEARER_TOKEN")

def check_auth():
  if not BEARER_TOKEN:
    # If token is not configured, pass auth checks (useful for local dev)
    return None
  
  auth_header = request.headers.get("Authorization")
  if not auth_header or not auth_header.startswith("Bearer "):
    return jsonify({"error": "Unauthorized: Missing or invalid token format"}), 401
  
  token = auth_header.split(" ", 1)[1].strip()
  if token != BEARER_TOKEN:
    return jsonify({"error": "Unauthorized: Invalid token"}), 401
  
  return None

@app.before_request
def before_request_func():
  # Exclude health, ready, and metrics endpoints from authentication
  if request.path in ["/health", "/ready", "/metrics"]:
    return None
  return check_auth()

@app.route("/health", methods=["GET"])
def health():
  model_loaded = provider is not None
  return jsonify({
    "status": "healthy",
    "model_loaded": model_loaded,
    "provider": "InsightFace",
    "uptime": int(time.time() - START_TIME)
  }), 200

@app.route("/ready", methods=["GET"])
def ready():
  try:
    # 1. Verify Firestore connection
    db = get_db()
    db.collection(config.COLLECTION_JOBS).limit(1).get()
    
    # 2. Verify InsightFace model
    if provider is None or (not provider.mock_mode and (not hasattr(provider, "model") or provider.model is None)):
      return jsonify({"status": "not_ready", "error": "InsightFace model not initialized"}), 503
      
    return jsonify({
      "status": "ready",
      "firestore_connected": True,
      "model_loaded": True
    }), 200
  except Exception as e:
    return jsonify({"status": "not_ready", "error": str(e)}), 503

@app.route("/metrics", methods=["GET"])
def metrics():
  uptime = int(time.time() - START_TIME)
  with metrics_lock:
    avg_inference = 0.0
    if metrics_data["jobs_processed"] > 0:
      avg_inference = metrics_data["total_inference_time_ms"] / metrics_data["jobs_processed"]
      
    avg_faces = 0.0
    if metrics_data["jobs_processed"] > 0:
      avg_faces = metrics_data["total_faces_detected"] / metrics_data["jobs_processed"]

    return jsonify({
      "uptime_seconds": uptime,
      "jobs_processed": metrics_data["jobs_processed"],
      "average_faces_per_image": round(avg_faces, 2),
      "average_inference_time_ms": round(avg_inference, 2),
      "total_faces_detected": metrics_data["total_faces_detected"]
    })

def run_background_worker():
  print("[*] Starting background AI Processing Worker loop...")
  worker = AIWorker()
  worker.start()

@app.route("/embed", methods=["POST"])
def embed():
  if "image" not in request.files:
    return jsonify({"error": "No image file provided in request.files"}), 400
  
  file = request.files["image"]
  # Save to temporary path for processing
  temp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tmp_search_query.jpg")
  os.makedirs(os.path.dirname(temp_path), exist_ok=True)
  file.save(temp_path)

  try:
    start_t = time.time()
    results = provider.process_image(temp_path)
    inference_ms = (time.time() - start_t) * 1000

    # Record metrics
    with metrics_lock:
      metrics_data["jobs_processed"] += 1
      metrics_data["total_faces_detected"] += len(results)
      metrics_data["total_inference_time_ms"] += inference_ms

    faces = []
    for face in results:
      faces.append({
        "embedding": face["embedding"],
        "boundingBox": face["boundingBox"],
        "confidence": face["detectionConfidence"],
        "landmarks": face["landmarks"],
        "pose": face["pose"],
        "faceWidth": face["faceWidth"],
        "faceHeight": face["faceHeight"]
      })
    return jsonify({"faces": faces})
  except Exception as e:
    return jsonify({"error": str(e)}), 500
  finally:
    if os.path.exists(temp_path):
      try:
        os.remove(temp_path)
      except Exception:
        pass

@app.route("/search", methods=["POST"])
def search():
  if "image" not in request.files:
    return jsonify({"error": "No image file provided"}), 400
  
  event_id = request.form.get("eventId")
  if not event_id:
    return jsonify({"error": "Missing eventId"}), 400
  
  min_conf_str = request.form.get("minimumConfidence", "0.35")
  try:
    minimum_confidence = float(min_conf_str)
  except ValueError:
    minimum_confidence = 0.35

  file = request.files["image"]
  temp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tmp_search_query.jpg")
  os.makedirs(os.path.dirname(temp_path), exist_ok=True)
  file.save(temp_path)

  try:
    start_t = time.time()
    query_faces = provider.process_image(temp_path)
    inference_ms = (time.time() - start_t) * 1000

    # Record metrics
    with metrics_lock:
      metrics_data["jobs_processed"] += 1
      metrics_data["total_faces_detected"] += len(query_faces)
      metrics_data["total_inference_time_ms"] += inference_ms

    if not query_faces:
      return jsonify({"faces": [], "matches": [], "error": "No faces detected in query image"}), 200

    # Use the largest face's embedding as query embedding
    query_emb = np.array(query_faces[0]["embedding"])

    # 2. Retrieve all active stored embeddings for this event from Firestore
    db = get_db()
    embeddings_ref = db.collection(config.COLLECTION_EMBEDDINGS)
    docs = embeddings_ref.where("eventId", "==", event_id).where("status", "==", "active").stream()

    stored_embeddings = []
    stored_docs = []
    
    for doc in docs:
      data = doc.to_dict()
      emb_vec = data.get("embedding")
      if emb_vec and len(emb_vec) == 512:
        stored_embeddings.append(emb_vec)
        stored_docs.append(data)

    matches = []
    if stored_embeddings:
      stored_matrix = np.array(stored_embeddings) # (N, 512)
      
      # Since embeddings are L2 normalized, cosine similarity is just dot product
      # query_emb has shape (512,)
      similarities = np.dot(stored_matrix, query_emb) # shape (N,)
      
      # Filter and format matches
      for idx, sim in enumerate(similarities):
        sim_val = float(sim)
        if sim_val >= minimum_confidence:
          doc_data = stored_docs[idx]
          matches.append({
            "embeddingId": doc_data.get("embeddingId"),
            "photoId": doc_data.get("photoId"),
            "similarity": sim_val,
            "boundingBox": doc_data.get("boundingBox"),
            "faceIndex": doc_data.get("faceIndex", doc_data.get("regionIndex", 0)),
            "qualityScore": doc_data.get("qualityScore", 1.0),
            "provider": doc_data.get("provider"),
            "embeddingVersion": doc_data.get("embeddingVersion")
          })

      # Sort matches by similarity descending
      matches = sorted(matches, key=lambda m: m["similarity"], reverse=True)

    faces_result = []
    for face in query_faces:
      faces_result.append({
        "boundingBox": face["boundingBox"],
        "confidence": face["detectionConfidence"],
        "landmarks": face["landmarks"],
        "pose": face["pose"]
      })

    return jsonify({
      "faces": faces_result,
      "matches": matches,
      "queryEmbedding": query_emb.tolist()
    })

  except Exception as e:
    return jsonify({"error": str(e)}), 500
  finally:
    if os.path.exists(temp_path):
      try:
        os.remove(temp_path)
      except Exception:
        pass

def main():
  print("[*] Starting CaptureSpace AI Processing Background Worker and Web Server...")
  init_firebase()
  
  # Spawn background worker thread
  worker_thread = threading.Thread(target=run_background_worker, daemon=True)
  worker_thread.start()

  # Run Flask server
  port = int(os.environ.get("PORT", 5000))
  print(f"[*] Starting Flask Server on port {port}...")
  app.run(host="0.0.0.0", port=port, debug=False)

if __name__ == "__main__":
  main()
