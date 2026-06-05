"""URL normalization and domain extraction utilities."""
import re
from urllib.parse import urlparse


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def extract_domain(url: str) -> str:
    """Return lowercase domain without www. prefix."""
    try:
        parsed = urlparse(normalize_url(url))
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return url.lower().strip()


def normalize_domain(url: str) -> str:
    """Consistent cache key from any URL form of the same company."""
    return extract_domain(url)
