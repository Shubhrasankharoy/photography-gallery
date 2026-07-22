from .base import BaseProvider
from .insightface_provider import InsightFaceProvider

class ProviderFactory:
  @staticmethod
  def get_provider(provider_name: str) -> BaseProvider:
    name_lower = provider_name.lower()
    if name_lower == "insightface":
      return InsightFaceProvider()
    else:
      # Default fallback provider
      return InsightFaceProvider()

provider_factory = ProviderFactory()
