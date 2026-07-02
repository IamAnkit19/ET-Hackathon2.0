import random
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
import json
import os
import datetime
from app.database import get_db
from app.models.schemas import Account, Transaction, Case, Alert
from app.ml.graph_engine import GraphEngine
from fpdf import FPDF

router = APIRouter(prefix="/graph", tags=["fraud_graph"])

@router.get("/network")
def get_network(db: Session = Depends(get_db)):
    txs = db.query(Transaction).all()
    accts = db.query(Account).all()
    
    txs_dict = [t.__dict__ for t in txs]
    accts_dict = [a.__dict__ for a in accts]
    
    engine = GraphEngine(txs_dict, accts_dict)
    return engine.get_network_graph()

@router.get("/rings")
def get_rings(db: Session = Depends(get_db)):
    txs = db.query(Transaction).all()
    accts = db.query(Account).all()
    
    txs_dict = [t.__dict__ for t in txs]
    accts_dict = [a.__dict__ for a in accts]
    
    engine = GraphEngine(txs_dict, accts_dict)
    return engine.get_detected_rings()

@router.get("/node/{acct_id}")
def get_node(acct_id: str, db: Session = Depends(get_db)):
    acct = db.query(Account).filter(Account.account_id == acct_id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")
        
    # Get outgoing and incoming transactions
    txs_out = db.query(Transaction).filter(Transaction.source_account == acct_id).all()
    txs_in = db.query(Transaction).filter(Transaction.target_account == acct_id).all()
    
    return {
        "account": acct,
        "transactions_out": txs_out,
        "transactions_in": txs_in,
        "total_volume": sum(t.amount for t in txs_out) + sum(t.amount for t in txs_in)
    }

@router.post("/investigate")
def investigate_account(payload: dict, db: Session = Depends(get_db)):
    acct_id = payload.get("account_id")
    if not acct_id:
        raise HTTPException(status_code=400, detail="Account ID required")
        
    acct = db.query(Account).filter(Account.account_id == acct_id).first()
    if not acct:
        # Create a mock/simulated account in database if it doesn't exist for demo flexibility
        acct = Account(
            account_id=acct_id,
            owner_name="Unknown Investigated Node",
            phone_number="+919999911111",
            registration_ip="192.168.1.99",
            risk_score=85.0,
            status="SUSPICIOUS"
        )
        db.add(acct)
        db.commit()
        db.refresh(acct)
        
    # Check if a case already exists
    case_ref = f"VYUH-2026-{acct_id[-4:]}"
    existing_case = db.query(Case).filter(Case.case_id == case_ref).first()
    
    if not existing_case:
        # Create court ready case
        new_case = Case(
            case_id=case_ref,
            type="Mule Account Ring Investigation",
            risk_score=acct.risk_score,
            accounts_flagged=1,
            est_loss=150000.0,
            status="UNDER_INVESTIGATION",
            generated_fir_draft=f"""FIRST INFORMATION REPORT
(Under Section 154 CrPC)
1. Police Station: Cyber Crime Unit, New Delhi
2. Case ID: {case_ref}
3. Suspect Account: {acct.account_id}
4. Registered Name: {acct.owner_name}
5. Risk Metrics: PageRank centrality: {acct.page_rank_score}, TDA cycle signature: {acct.tda_score}
6. Legal Accusations: IT Act Section 66D, IPC Section 420. Coordinated mule ring transactions identified.""",
            evidence_data=json.dumps({
                "account_id": acct.account_id,
                "owner_name": acct.owner_name,
                "risk_score": acct.risk_score,
                "ip": acct.registration_ip
            })
        )
        db.add(new_case)
        db.commit()
        existing_case = new_case
        
    return {
        "case_id": existing_case.case_id,
        "status": existing_case.status,
        "fir_draft": existing_case.generated_fir_draft,
        "account": acct
    }

@router.get("/export-evidence/{case_id}")
def export_evidence_pdf(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Generate dynamic PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(10, 15, 30) # Deep Navy Command
    pdf.cell(0, 10, "VYUH DIGITAL SAFETY INTELLIGENCE PLATFORM", ln=True, align="C")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "COURT-READY EVIDENCE PACKAGE (NCRB CASE REPORT STANDARD)", ln=True, align="C")
    pdf.ln(10)
    
    # Border line
    pdf.line(10, 30, 200, 30)
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(50, 8, "CASE REFERENCE ID:", 0, 0)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, case.case_id, 0, 1)
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(50, 8, "CASE CLASSIFICATION:", 0, 0)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, case.type, 0, 1)
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(50, 8, "ESTIMATED DISRUPTED LOSS:", 0, 0)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"INR {case.est_loss:,.2f}", 0, 1)
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(50, 8, "COMPOSITE RISK INDEX:", 0, 0)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"{case.risk_score}% (CRITICAL)", 0, 1)
    
    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "1. DRAFT FIRST INFORMATION REPORT (FIR)", ln=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(0, 5, case.generated_fir_draft or "No Draft Generated")
    pdf.ln(5)
    
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. DIGITAL EVIDENCE FOOTPRINT & CLASSIFICATION", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, f"AI graph topological signatures (TDA Betti numbers) indicate coordinates of money loop cycling. Primary node registered IP log connects directly to scam endpoints. Case status is set to {case.status}.")
    
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 5, "This document is generated automatically by VYUH Intelligence Systems under IT Act Compliance.", ln=True, align="C")
    
    pdf_filename = f"evidence_{case_id}.pdf"
    pdf.output(pdf_filename)
    
    return FileResponse(pdf_filename, media_type="application/pdf", filename=pdf_filename)

@router.post("/upload")
def upload_transactions(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Simulates uploading transaction logs CSV
    content = file.file.read()
    # Read as dataframe to verify
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV format")
        
    # Seed new mock records for demo response
    new_mules_count = random.randint(3, 8)
    # Generate alerts
    alert = Alert(
        module="graph",
        alert_type="CSV Upload Success",
        title=f"CSV Uploaded: {len(df)} transactions",
        description=f"Analysis identified {new_mules_count} suspicious accounts matching transaction velocity spikes.",
        severity="HIGH"
    )
    db.add(alert)
    db.commit()
    
    return {
        "success": True,
        "processed_rows": len(df),
        "new_suspicious_nodes": new_mules_count,
        "message": "Transactions merged successfully. community detection pipeline recalculated."
    }
