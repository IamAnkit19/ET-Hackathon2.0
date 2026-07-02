from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.database import Base
import datetime

class Account(Base):
    __tablename__ = "accounts"
    
    account_id = Column(String, primary_key=True, index=True)
    owner_name = Column(String)
    phone_number = Column(String)
    registration_ip = Column(String)
    risk_score = Column(Float, default=0.0)
    page_rank_score = Column(Float, default=0.0)
    velocity_score = Column(Float, default=0.0)
    tda_score = Column(Float, default=0.0)
    community_id = Column(Integer, default=0)
    status = Column(String, default="SAFE")  # SAFE, SUSPICIOUS, MULE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_account = Column(String, index=True)
    target_account = Column(String, index=True)
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    type = Column(String)  # UPI, IMPS, NEFT, RTGS
    ip_address = Column(String)
    device_id = Column(String)
    phone_number = Column(String)
    is_fraud = Column(Boolean, default=False)

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    module = Column(String)  # graph, scam, currency, chatbot, map
    alert_type = Column(String)
    title = Column(String)
    description = Column(Text)
    severity = Column(String)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="PENDING")  # PENDING, ACKNOWLEDGED, RESOLVED
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    meta_data = Column(Text, nullable=True)  # JSON serialized

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(String, unique=True, index=True)  # e.g., "VYUH-2026-001"
    type = Column(String)  # Mule Ring, Digital Arrest, FICN Ring, etc.
    risk_score = Column(Float)
    accounts_flagged = Column(Integer)
    est_loss = Column(Float)
    status = Column(String, default="OPEN")  # OPEN, UNDER_INVESTIGATION, CLOSED
    generated_fir_draft = Column(Text, nullable=True)
    evidence_data = Column(Text, nullable=True)  # JSON serialized
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ScamComplaint(Base):
    __tablename__ = "scam_complaints"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_text = Column(Text)
    scam_type = Column(String)
    confidence = Column(Float)
    urgency_level = Column(String)  # LOW, MEDIUM, HIGH, CRITICAL
    phone_number = Column(String, nullable=True)
    state = Column(String, default="National")
    district = Column(String, default="")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class FICNSeizure(Base):
    __tablename__ = "ficn_seizures"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    denomination = Column(Integer)
    count = Column(Integer)
    state = Column(String)
    district = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    serial_numbers = Column(String)  # Comma separated
    is_fake = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class CrimeIncident(Base):
    __tablename__ = "crime_incidents"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    crime_type = Column(String)  # UPI Fraud, Digital Arrest, Phishing, Identity Theft
    severity = Column(String)  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text)
    state = Column(String)
    district = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
