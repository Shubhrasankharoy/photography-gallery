import os
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
    results = provider.process_image(temp_path)
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
    # 1. Detect faces in the uploaded query image
    query_faces = provider.process_image(temp_path)
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
