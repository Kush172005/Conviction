from typing import List
from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class ChatCitation(BaseModel):
    source_type: str
    source_id: str
    snippet: str


class ChatResponse(BaseModel):
    answer: str
    citations: List[ChatCitation] = []
