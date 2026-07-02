from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import ScamComplaint, Alert
from app.ml.rag_chain import RAGChain
import random

router = APIRouter(prefix="/chatbot", tags=["chatbot"])
chain = RAGChain()

@router.post("/message")
def chatbot_message(payload: dict):
    message = payload.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
        
    res = chain.generate_response(message)
    return res

@router.post("/analyze-content")
def analyze_content(payload: dict):
    content = payload.get("content", "")
    content_lower = content.lower()
    
    verdict = "SAFE"
    confidence = 0.95
    reasons = []
    
    # URL checks
    urls = [".net", ".xyz", ".org-update", "sbi-kyc", "free-gift", "paytm-cash"]
    if any(u in content_lower for u in urls):
        verdict = "SUSPICIOUS"
        confidence = 0.88
        reasons.append("Contains unverified domain suffix or matches known KYC SMS phishing profiles.")
        
    # Phone checks
    scammer_prefixes = ["+92", "+234", "+91911", "+91112"]
    if any(content_lower.startswith(p) for p in scammer_prefixes):
        verdict = "COUNTERFEIT" # Using counterfeit as severe indicator / SCAM
        verdict = "SUSPICIOUS"
        confidence = 0.96
        reasons.append("Caller prefix matches international high-risk telecom corridors.")
        
    if "lottery" in content_lower or "part time job" in content_lower or "cbi officer" in content_lower:
        verdict = "SUSPICIOUS"
        confidence = 0.94
        reasons.append("Content features key phrases associated with part-time job task traps or digital arrest scams.")
        
    return {
        "verdict": verdict if len(reasons) > 0 else "SAFE",
        "confidence": confidence,
        "flagged_features": reasons,
        "recommendation": "Do not reply, click, or transfer any currency. Block the sender." if len(reasons) > 0 else "No immediate threat indicators detected. Continue to exercise caution."
    }

@router.get("/helplines")
def get_helplines():
    return [
        {"state": "National Helpline", "number": "1930"},
        {"state": "Delhi", "number": "11-20892222"},
        {"state": "Maharashtra", "number": "022-22160080"},
        {"state": "Karnataka", "number": "080-22375522"},
        {"state": "Telangana", "number": "040-27852412"},
        {"state": "Tamil Nadu", "number": "044-22318610"},
        {"state": "West Bengal", "number": "033-22145486"}
    ]
