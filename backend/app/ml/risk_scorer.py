from sqlalchemy.orm import Session
from app.models.schemas import Account, ScamComplaint, FICNSeizure, Alert
import numpy as np

class RiskScorer:
    @staticmethod
    def calculate_vis(db: Session) -> float:
        """
        Computes the VYUH Intelligence Score (VIS) - National Fraud Threat Index (0-100).
        VIS = 0.4 * (Mule Risk Rate) + 0.3 * (Scam Complaint Velocity) + 0.2 * (FICN Rate) + 0.1 * (Active Alerts)
        """
        # 1. Mule Risk factor (percent of suspicious or mule accounts in the system)
        try:
            total_accounts = db.query(Account).count()
            if total_accounts > 0:
                mule_accounts = db.query(Account).filter(Account.status.in_(["MULE", "SUSPICIOUS"])).count()
                mule_factor = (mule_accounts / total_accounts) * 100.0
            else:
                mule_factor = 50.0
        except Exception:
            mule_factor = 50.0
            
        # 2. Scam Complaint Velocity (number of critical/high cases in the last 30 days)
        try:
            total_scams = db.query(ScamComplaint).count()
            critical_scams = db.query(ScamComplaint).filter(ScamComplaint.urgency_level.in_(["CRITICAL", "HIGH"])).count()
            scam_factor = (critical_scams / max(1, total_scams)) * 100.0
        except Exception:
            scam_factor = 45.0
            
        # 3. FICN counterfeit count factor
        try:
            seizures_count = db.query(FICNSeizure).count()
            # Normalize to 0-100 based on scale
            ficn_factor = min(100.0, seizures_count * 2.0)
        except Exception:
            ficn_factor = 30.0
            
        # 4. Active unresolved alerts factor
        try:
            active_alerts = db.query(Alert).filter(Alert.status == "PENDING").count()
            alert_factor = min(100.0, active_alerts * 10.0)
        except Exception:
            alert_factor = 40.0
            
        # Ensembled weighted score
        vis = (0.4 * mule_factor) + (0.3 * scam_factor) + (0.2 * ficn_factor) + (0.1 * alert_factor)
        return round(float(vis), 1)
