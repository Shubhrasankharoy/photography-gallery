from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseProvider(ABC):
  @abstractmethod
  def name(self) -> str:
    """Returns the name of the AI provider."""
    pass

  @abstractmethod
  def version(self) -> str:
    """Returns the version of the provider/model."""
    pass

  @abstractmethod
  def embedding_version(self) -> str:
    """Returns the embedding version/format string."""
    pass

  @abstractmethod
  def process_image(self, image_path: str) -> List[Dict[str, Any]]:
    """
    Processes an image at image_path and returns detected elements (e.g. faces).
    Each returned element should be a dictionary with keys:
      - 'bounding_box': { 'x': float, 'y': float, 'width': float, 'height': float, 'confidence': float }
      - 'embedding': List[float] (if embeddings are generated)
      - 'confidence': float
    """
    pass
