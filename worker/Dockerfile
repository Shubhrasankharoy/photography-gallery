FROM python:3.9-slim

# Install system dependencies required for OpenCV, build-essential, CMake (for insightface setup)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies first to utilize Docker layer cache
COPY requirements.txt .

# Install dependencies (use --no-cache-dir to minimize image size)
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker source code
COPY . .

# Run the background worker main process
CMD ["python", "main.py"]
