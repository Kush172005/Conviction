"""
Plain character-window chunker for RAG indexing.
No token-counting library — character length is a fine proxy at this corpus size.
"""
from typing import List


def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> List[str]:
    """
    Split text into ~chunk_size-character windows with overlap, breaking on
    paragraph boundaries where possible. Text shorter than chunk_size comes
    back as a single chunk.
    """
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text]

    chunks: List[str] = []
    current = ""
    for para in paragraphs:
        candidate = f"{current}\n\n{para}" if current else para
        if len(candidate) <= chunk_size:
            current = candidate
            continue

        if current:
            chunks.append(current)
        if len(para) <= chunk_size:
            current = para
        else:
            # A single paragraph longer than chunk_size — hard-split with overlap.
            start = 0
            while start < len(para):
                end = start + chunk_size
                chunks.append(para[start:end])
                start = end - overlap
            current = ""

    if current:
        chunks.append(current)

    # Stitch overlap between adjacent chunks so context isn't lost at boundaries.
    overlapped: List[str] = []
    for i, chunk in enumerate(chunks):
        if i == 0 or overlap <= 0:
            overlapped.append(chunk)
            continue
        prefix = chunks[i - 1][-overlap:]
        overlapped.append(f"{prefix}{chunk}")

    return overlapped
