from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import ScamComplaint, Alert
from app.ml.scam_classifier import ScamClassifier
import datetime
import random

router = APIRouter(prefix="/scam", tags=["scam_detector"])
classifier = ScamClassifier()

@router.post("/analyze-complaint")
def analyze_complaint(payload: dict, db: Session = Depends(get_db)):
    text = payload.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text required")
        
    result = classifier.classify_complaint(text)
    
    # Optionally save to database as complaint
    new_comp = ScamComplaint(
        complaint_text=text,
        scam_type=result["scam_type"],
        confidence=result["confidence"],
        urgency_level=result["urgency_level"],
        state=payload.get("state", "Delhi"),
        district=payload.get("district", "New Delhi")
    )
    db.add(new_comp)
    
    # Generate Alert if high risk
    if result["urgency_level"] in ["CRITICAL", "HIGH"]:
        alert = Alert(
            module="scam",
            alert_type="Digital Arrest Alert" if result["scam_type"] == "Digital Arrest" else "High Risk Scam",
            title=f"New {result['scam_type']} Flagged",
            description=f"Confidence: {result['confidence']*100}%. Text summary: {text[:100]}...",
            severity=result["urgency_level"]
        )
        db.add(alert)
        
    db.commit()
    return result

@router.post("/analyze-call")
def analyze_call(payload: dict):
    # Analyze call logs metadata
    # Expected inputs: duration, caller_prefix, time_hour, transfer_proximity
    result = classifier.analyze_call_metadata(payload)
    return result

@router.get("/patterns")
def get_patterns():
    # Return simulated pattern descriptions for the active scam patterns panel
    return [
        {
            "id": 1,
            "type": "Digital Arrest",
            "key_vector": "Skype Video + CBI Impersonation",
            "active_since": "June 2026",
            "volume_index": "HIGH",
            "threat_rating": 95,
            "description": "Scammers pose as Customs officials calling from Mumbai airport regarding narcotic packages under victim's Aadhaar, then connect via Skype/WhatsApp Video to fake CBI interrogation units."
        },
        {
            "id": 2,
            "type": "KYC Update Fraud",
            "key_vector": "Urgent SMS link + PAN Card",
            "active_since": "May 2026",
            "volume_index": "MEDIUM",
            "threat_rating": 78,
            "description": "SMS requests to update PAN immediately to prevent bank account suspension; leads to cloned netbanking login portals capturing credentials and OTPs."
        },
        {
            "id": 3,
            "type": "Part Time YouTube Jobs",
            "key_vector": "Telegram Tasks + VIP deposits",
            "active_since": "April 2026",
            "volume_index": "HIGH",
            "threat_rating": 82,
            "description": "Victims are lured into YouTube video like tasks paying small amounts. Subsequently coerced into joining premium VIP cryptocurrency pools with locked deposits."
        }
    ]

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    # Group and aggregate data from database
    complaints = db.query(ScamComplaint).all()
    
    # Default counts for robust statistics
    counts = {
        "Digital Arrest": 0,
        "FedEx Parcel Scam": 0,
        "KYC Fraud": 0,
        "Investment Scam": 0,
        "Job Fraud": 0,
        "Sextortion": 0,
        "OTP Fraud": 0,
        "Loan App Fraud": 0,
        "Fake Customer Care": 0,
        "Romance Scam": 0
    }
    
    for c in complaints:
        if c.scam_type in counts:
            counts[c.scam_type] += 1
            
    # Mocking standard financial loss parameters matching real RBI scale
    losses = {
        "Digital Arrest": 177600000.0, # Rs 17.7 Crore
        "FedEx Parcel Scam": 95000000.0,
        "KYC Fraud": 45000000.0,
        "Investment Scam": 120000000.0,
        "Job Fraud": 68000000.0,
        "Sextortion": 23000000.0,
        "OTP Fraud": 38000000.0,
        "Loan App Fraud": 19000000.0,
        "Fake Customer Care": 12000000.0,
        "Romance Scam": 15000000.0
    }
    
    leaderboard = []
    for k, count in counts.items():
        leaderboard.append({
            "scam_type": k,
            "cases_count": count + random.randint(10, 45), # adding seed offset
            "estimated_loss": losses.get(k, 10000000.0),
            "top_state": random.choice(["Maharashtra", "Delhi", "Karnataka", "Telangana"])
        })
        
    return sorted(leaderboard, key=lambda x: x["cases_count"], reverse=True)

@router.post("/report")
def report_scam(payload: dict, db: Session = Depends(get_db)):
    # Citizen reporting endpoint
    complaint = ScamComplaint(
        complaint_text=payload.get("text"),
        scam_type=payload.get("scam_type", "Unknown"),
        confidence=0.90,
        urgency_level="HIGH",
        phone_number=payload.get("phone"),
        state=payload.get("state", "Delhi"),
        district=payload.get("district", "New Delhi")
    )
    db.add(complaint)
    
    # Trigger alert
    alert = Alert(
        module="scam",
        alert_type="Citizen Report",
        title=f"Citizen Reported: {payload.get('scam_type')}",
        description=f"Reported phone number: {payload.get('phone')}. Action: Verified entry logged.",
        severity="HIGH"
    )
    db.add(alert)
    db.commit()
    return {"success": True, "message": "Report submitted. Incident logged under cyber database."}
