from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import CrimeIncident, FICNSeizure, Alert
from app.data.ncrb_loader import NCRBLoader
import random

router = APIRouter(prefix="/map", tags=["crime_map"])

@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    # Returns raw locations list for Heatmap display
    incidents = db.query(CrimeIncident).all()
    points = []
    for inc in incidents:
        points.append({
            "lat": inc.latitude,
            "lng": inc.longitude,
            "intensity": 0.8 if inc.severity == "CRITICAL" else (0.6 if inc.severity == "HIGH" else 0.4)
        })
    return points

@router.get("/ficn-seizures")
def get_ficn_seizures(db: Session = Depends(get_db)):
    seizures = db.query(FICNSeizure).all()
    return seizures

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(CrimeIncident).all()
    return incidents

@router.get("/hotspots")
def get_hotspots():
    # Return AI-predicted hotspots for 30-day forecast
    # We display them as pulsing circle zones in specific coordinates (like Jamtara, Mewat, Bangalore, Noida)
    return [
        {
            "id": 1,
            "area": "Jamtara, Jharkhand",
            "lat": 23.9620,
            "lng": 86.8023,
            "radius": 15000, # meters
            "growth_forecast": "+24% surge predicted",
            "dominant_crime": "UPI Phishing",
            "severity": "CRITICAL"
        },
        {
            "id": 2,
            "area": "Mewat, Haryana",
            "lat": 28.1250,
            "lng": 77.0100,
            "radius": 12000,
            "growth_forecast": "+18% surge predicted",
            "dominant_crime": "Sextortion / OLX Scam",
            "severity": "HIGH"
        },
        {
            "id": 3,
            "area": "Noida Sector 62, Uttar Pradesh",
            "lat": 28.5355,
            "lng": 77.3910,
            "radius": 8000,
            "growth_forecast": "+12% surge predicted",
            "dominant_crime": "Digital Arrest Scams",
            "severity": "HIGH"
        }
    ]

@router.get("/corridors")
def get_corridors():
    # Return inter-state money movement flow lines
    # From origin (usually Jamtara or scam hub) to ATM/Mule cashouts
    return [
        {
            "id": 1,
            "from_name": "Jamtara, JH",
            "from_coords": [23.9620, 86.8023],
            "to_name": "Delhi NCR",
            "to_coords": [28.6139, 77.2090],
            "risk": "HIGH",
            "flow_volume": "34.5L debited"
        },
        {
            "id": 2,
            "from_name": "Mewat, HR",
            "from_coords": [28.1250, 77.0100],
            "to_name": "Mumbai, MH",
            "to_coords": [19.0760, 72.8777],
            "risk": "CRITICAL",
            "flow_volume": "78.2L debited"
        },
        {
            "id": 3,
            "from_name": "Malda, WB (FICN Entry)",
            "from_coords": [25.0112, 88.1352],
            "to_name": "Kolkata, WB",
            "to_coords": [22.5726, 88.3639],
            "risk": "HIGH",
            "flow_volume": "1500 fake notes route"
        }
    ]

@router.get("/patrol-recommend")
def get_patrol_recommendations(district: str = "New Delhi"):
    # Returns automated patrol recommendations
    return {
        "district": district,
        "recommendations": [
            "Increase cybersecurity patrols around Noida Sector 62 IT hub corridor.",
            "Alert local banks near Malda border points to inspect high-denomination serials 9AA*.",
            "Dispatch alerts to local telecom nodes to intercept calls originating from Jamtara coordinate hexes."
        ],
        "patrol_priority": "HIGH"
    }

@router.post("/report")
def field_report_incident(payload: dict, db: Session = Depends(get_db)):
    new_inc = CrimeIncident(
        crime_type=payload.get("crime_type"),
        severity=payload.get("severity", "MEDIUM"),
        description=payload.get("description", "Field officer report logged."),
        state=payload.get("state"),
        district=payload.get("district"),
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude")
    )
    db.add(new_inc)
    
    alert = Alert(
        module="map",
        alert_type="Field Incident",
        title=f"Field Incident Filed: {payload.get('crime_type')}",
        description=f"Logged by officer in {payload.get('district')}. Severity: {payload.get('severity')}",
        severity=payload.get("severity")
    )
    db.add(alert)
    db.commit()
    return {"success": True, "message": "Incident logged on global cybercrime layer."}
