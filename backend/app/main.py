from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
import json
import datetime
from typing import List

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.models.schemas import Account, Alert
from app.data.seed_data import VYUHDataGenerator
from app.ml.risk_scorer import RiskScorer

from app.api import fraud_graph, scam_detector, currency, chatbot, crime_map

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
db = SessionLocal()
try:
    if db.query(Account).count() == 0:
        print("Database is empty. Seeding initial data...")
        generator = VYUHDataGenerator(db)
        generator.generate_all()
        print("Database seeding completed.")
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Digital Public Safety Platform for countering financial fraud and cyber arrest scams.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(fraud_graph.router, prefix=settings.API_V1_STR)
app.include_router(scam_detector.router, prefix=settings.API_V1_STR)
app.include_router(currency.router, prefix=settings.API_V1_STR)
app.include_router(chatbot.router, prefix=settings.API_V1_STR)
app.include_router(crime_map.router, prefix=settings.API_V1_STR)

# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# Global Stats / VIS Score endpoint for Dashboard Dashboard
@app.get("/api/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    vis_score = RiskScorer.calculate_vis(db)
    
    # Aggregated stats
    mules_count = db.query(Account).filter(Account.status == "MULE").count()
    suspicious_count = db.query(Account).filter(Account.status == "SUSPICIOUS").count()
    alerts_count = db.query(Alert).filter(Alert.status == "PENDING").count()
    
    return {
        "vyuh_intelligence_score": vis_score,
        "active_alerts": alerts_count,
        "mules_flagged": mules_count,
        "suspicious_accounts": suspicious_count,
        "threat_level": 4 if vis_score > 75 else (3 if vis_score > 50 else 2),
        "national_kpis": {
            "complaints_today": random_offset_kpi(184, 15),
            "active_networks": random_offset_kpi(28, 2),
            "ficn_seized_30d": random_offset_kpi(1240, 50),
            "scams_intercepted": random_offset_kpi(392, 10)
        }
    }

def random_offset_kpi(base, offset):
    return base + random_choice_offset(offset)

def random_choice_offset(offset):
    import random
    return random.randint(-offset, offset)

# Trigger manual re-seeding
@app.post("/api/seed-db")
def manual_seed_db(db: Session = Depends(get_db)):
    generator = VYUHDataGenerator(db)
    generator.generate_all()
    return {"success": True, "message": "Database successfully re-seeded!"}

# WebSocket Alert stream
@app.websocket("/api/ws/alerts")
async def websocket_alerts(websocket: WebSocket, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        # Send initial backlog of alerts
        backlog = db.query(Alert).order_by(Alert.timestamp.desc()).limit(15).all()
        backlog_data = []
        for alert in backlog:
            backlog_data.append({
                "id": alert.id,
                "module": alert.module,
                "type": alert.alert_type,
                "title": alert.title,
                "description": alert.description,
                "severity": alert.severity,
                "timestamp": alert.timestamp.isoformat()
            })
        await websocket.send_text(json.dumps({"type": "backlog", "data": backlog_data}))
        
        # Keep connection open and broadcast new simulation alerts periodically
        while True:
            # Check for new alerts or generate synthetic real-time event for visual richness
            await asyncio.sleep(5)
            
            # Generate a dynamic live alert to simulate real-time detection
            modules = ["graph", "scam", "currency", "map"]
            mod = random_choice_module(modules)
            
            sim_titles = {
                "graph": "High-Velocity Cycle Detected",
                "scam": "Impersonation Call Intercepted",
                "currency": "Suspect ₹500 Scan Flagged",
                "map": "Localized Incident Logged"
            }
            
            sim_descs = {
                "graph": f"Account 98765432{random_choice_num():02d} routed ₹1.5L in suspicious transactional loops.",
                "scam": "System flagged Telecom operator code matching customs scam keywords.",
                "currency": f"Watermark check failed on note serial 9AA{random_choice_serial()}.",
                "map": "Citizen report of FedEx parcel trap filed near Noida Sector 62 coordinates."
            }
            
            sim_alert = {
                "type": "live",
                "data": {
                    "id": random_choice_num() * 100,
                    "module": mod,
                    "type": "Real-time Detection",
                    "title": sim_titles[mod],
                    "description": sim_descs[mod],
                    "severity": "HIGH" if mod in ["graph", "scam"] else "MEDIUM",
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            }
            await websocket.send_text(json.dumps(sim_alert))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def random_choice_module(arr):
    import random
    return random.choice(arr)

def random_choice_num():
    import random
    return random.randint(1, 23)

def random_choice_serial():
    import random
    return random.randint(100000, 999999)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
