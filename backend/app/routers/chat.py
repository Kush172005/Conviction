"""
RAG chat router — ask questions about a specific company, answered from its
indexed calls/decisions/memory entries.
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_current_user, get_db
from app.repositories import CompanyRepository
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag import answer_question

router = APIRouter(prefix="/companies/{company_id}/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def ask_question(
    company_id: str,
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    company = await CompanyRepository(db).find_by_id_for_user(company_id, current_user["id"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if not body.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty")

    result = await answer_question(
        db,
        user_id=current_user["id"],
        company_id=company_id,
        company_name=company.get("name", "this company"),
        question=body.question,
    )
    return ChatResponse(**result)
