import random
import datetime
import json
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.schemas import Account, Transaction, Alert, Case, ScamComplaint, FICNSeizure, CrimeIncident

class VYUHDataGenerator:
    def __init__(self, db: Session):
        self.db = db

    def generate_all(self):
        # 1. Clear existing tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        # 2. Generate Accounts
        accounts = self._generate_accounts()
        
        # 3. Generate Transactions
        self._generate_transactions(accounts)
        
        # 4. Generate Scam Complaints
        self._generate_complaints()
        
        # 5. Generate FICN Seizures
        self._generate_ficn_seizures()
        
        # 6. Generate Crime Incidents (Map data)
        self._generate_crime_incidents()
        
        # 7. Generate Alerts
        self._generate_alerts()
        
        # 8. Generate Cases
        self._generate_cases()

    def _generate_accounts(self):
        accounts = []
        
        # Seed Ring 7 (Mule Ring of 23 accounts)
        # We make it a highly connected loop/flow structure with community_id=7
        for i in range(1, 24):
            acct_id = f"98765432{i:02d}"
            name = f"Mule Owner {i}"
            phone = f"+9198765{i:05d}"
            ip = f"192.168.4.{i}"
            
            # TDA and centrality metrics pre-calculated
            risk = 75.0 + random.uniform(10, 20)
            page_rank = 0.08 + (0.01 * (i % 5))
            velocity = 80.0 + random.uniform(5, 15)
            tda = 85.0 + random.uniform(5, 10)
            
            acct = Account(
                account_id=acct_id,
                owner_name=name,
                phone_number=phone,
                registration_ip=ip,
                risk_score=risk,
                page_rank_score=page_rank,
                velocity_score=velocity,
                tda_score=tda,
                community_id=7,
                status="MULE" if risk > 80 else "SUSPICIOUS",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(10, 50))
            )
            self.db.add(acct)
            accounts.append(acct)
            
        # Seed Ring 3 (Suspicious Ring of 8 accounts)
        for i in range(1, 9):
            acct_id = f"12345678{i:02d}"
            name = f"Suspicious Owner {i}"
            phone = f"+9112345{i:05d}"
            ip = f"10.0.2.{i}"
            risk = 50.0 + random.uniform(10, 20)
            page_rank = 0.03 + (0.005 * i)
            velocity = 45.0 + random.uniform(10, 25)
            tda = 60.0 + random.uniform(5, 15)
            
            acct = Account(
                account_id=acct_id,
                owner_name=name,
                phone_number=phone,
                registration_ip=ip,
                risk_score=risk,
                page_rank_score=page_rank,
                velocity_score=velocity,
                tda_score=tda,
                community_id=3,
                status="SUSPICIOUS",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(10, 30))
            )
            self.db.add(acct)
            accounts.append(acct)

        # Seed Safe Accounts (69 accounts)
        safe_names = ["Rajesh Kumar", "Anjali Sharma", "Amit Patel", "Sunita Rao", "Vijay Singh", "Priya Nair", "Suresh Das", "Deepa Gupta", "Vikram Mehta", "Kiran Joshi"]
        for i in range(1, 70):
            acct_id = f"55443322{i:02d}"
            name = random.choice(safe_names) + f" {i}"
            phone = f"+9199887{i:05d}"
            ip = f"172.16.8.{i}"
            risk = random.uniform(2, 15)
            page_rank = random.uniform(0.001, 0.008)
            velocity = random.uniform(5, 20)
            tda = random.uniform(1, 10)
            
            acct = Account(
                account_id=acct_id,
                owner_name=name,
                phone_number=phone,
                registration_ip=ip,
                risk_score=risk,
                page_rank_score=page_rank,
                velocity_score=velocity,
                tda_score=tda,
                community_id=0,
                status="SAFE",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(5, 100))
            )
            self.db.add(acct)
            accounts.append(acct)
            
        self.db.commit()
        return accounts

    def _generate_transactions(self, accounts):
        mule_ring_accounts = [a for a in accounts if a.community_id == 7]
        susp_ring_accounts = [a for a in accounts if a.community_id == 3]
        safe_accounts = [a for a in accounts if a.community_id == 0]
        
        # 1. Transactions in Mule Ring #7 (Coordinated circular and tree flows, high amounts)
        # We loop transaction from i to i+1
        n_mule = len(mule_ring_accounts)
        for i in range(n_mule):
            src = mule_ring_accounts[i].account_id
            dst = mule_ring_accounts[(i + 1) % n_mule].account_id
            
            # Create rapid/burst transactions
            for day in range(5):
                tx = Transaction(
                    source_account=src,
                    target_account=dst,
                    amount=random.uniform(50000, 200000),
                    timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=day, hours=random.randint(0, 10)),
                    type="UPI",
                    ip_address=mule_ring_accounts[i].registration_ip,
                    device_id=f"DEV-MULE-{i:03d}",
                    phone_number=mule_ring_accounts[i].phone_number,
                    is_fraud=True
                )
                self.db.add(tx)
                
            # Extra cross links
            dst_cross = mule_ring_accounts[(i + 5) % n_mule].account_id
            tx_cross = Transaction(
                source_account=src,
                target_account=dst_cross,
                amount=random.uniform(100000, 300000),
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 24)),
                type="IMPS",
                ip_address=mule_ring_accounts[i].registration_ip,
                device_id=f"DEV-MULE-{i:03d}",
                phone_number=mule_ring_accounts[i].phone_number,
                is_fraud=True
            )
            self.db.add(tx_cross)
            
        # 2. Transactions in Suspicious Ring #3
        n_susp = len(susp_ring_accounts)
        for i in range(n_susp):
            src = susp_ring_accounts[i].account_id
            dst = susp_ring_accounts[(i + 1) % n_susp].account_id
            tx = Transaction(
                source_account=src,
                target_account=dst,
                amount=random.uniform(10000, 50000),
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 10)),
                type="UPI",
                ip_address=susp_ring_accounts[i].registration_ip,
                device_id=f"DEV-SUSP-{i:03d}",
                phone_number=susp_ring_accounts[i].phone_number,
                is_fraud=False
            )
            self.db.add(tx)
            
        # 3. Standard Safe Transactions
        for i in range(300):
            src_acct = random.choice(safe_accounts)
            dst_acct = random.choice(safe_accounts)
            if src_acct.account_id == dst_acct.account_id:
                continue
                
            tx = Transaction(
                source_account=src_acct.account_id,
                target_account=dst_acct.account_id,
                amount=random.uniform(500, 10000),
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 30), hours=random.randint(0, 23)),
                type=random.choice(["UPI", "NEFT", "IMPS"]),
                ip_address=src_acct.registration_ip,
                device_id=f"DEV-SAFE-{random.randint(1, 100):03d}",
                phone_number=src_acct.phone_number,
                is_fraud=False
            )
            self.db.add(tx)
            
        # 4. Cash-out flows (Mules transfer to external / ATM withdraw mimics)
        # We mimic this by transfer from Ring 7 central hubs (Owner 1, Owner 12) to a suspicious outbound node
        for i in [0, 11]:
            src = mule_ring_accounts[i].account_id
            # External or untracked targets
            tx = Transaction(
                source_account=src,
                target_account="EXTERNAL_MULE_CASHOUT",
                amount=750000.0,
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(minutes=30),
                type="RTGS",
                ip_address=mule_ring_accounts[i].registration_ip,
                device_id=f"DEV-MULE-{i:03d}",
                phone_number=mule_ring_accounts[i].phone_number,
                is_fraud=True
            )
            self.db.add(tx)

        self.db.commit()

    def _generate_complaints(self):
        complaints = [
            # Hindi Digital Arrest
            {
                "text": "मुझे सुबह एक फोन कॉल आया। कॉल करने वाले ने खुद को सीबीआई अधिकारी बताया और कहा कि मेरे नाम पर भेजे गए एक पार्सल में प्रतिबंधित नशीले पदार्थ (नारकोटिक्स) मिले हैं। उसने मुझे स्काइप डाउनलोड करने को कहा और वीडियो कॉल पर मुझे 'डिजिटल अरेस्ट' में रख दिया। उसने धमकी दी कि अगर मैंने तुरंत ₹2,50,000 उनके 'सेफ एकाउंट' में ट्रांसफर नहीं किए, तो मुझे गिरफ्तार कर लिया जाएगा। मैंने डर के मारे पैसे ट्रांसफर कर दिए।",
                "scam_type": "Digital Arrest",
                "confidence": 0.98,
                "urgency_level": "CRITICAL",
                "state": "Delhi",
                "district": "New Delhi"
            },
            # English FedEx / Customs
            {
                "text": "Received a call from +91-91223-XXXX stating they are from customs department, Mumbai. They claimed a FedEx package containing passport, 5 credit cards, and 150 grams of MDMA is registered under my Aadhaar number. They connected the call to a fake cyber cell police officer who threatened me with jail time and forced me to transfer 4.5 Lakhs for verification.",
                "scam_type": "FedEx Parcel Scam",
                "confidence": 0.96,
                "urgency_level": "CRITICAL",
                "state": "Maharashtra",
                "district": "Mumbai"
            },
            # KYC Fraud
            {
                "text": "I got an SMS saying my SBI account will be blocked today if I do not update my KYC. The SMS contained a link: sbi-kyc-update.net. I clicked the link and entered my banking credentials and OTP. Within minutes, ₹85,000 was debited from my account in three transactions.",
                "scam_type": "KYC Fraud",
                "confidence": 0.95,
                "urgency_level": "HIGH",
                "state": "Karnataka",
                "district": "Bengaluru"
            },
            # WhatsApp Investment Scam
            {
                "text": "I was added to a WhatsApp group named 'Goldman Sachs Investment Academy'. They suggested buying IPO shares of Indian companies for high profits. They made me install an app called 'GS-Trade'. I deposited ₹10 Lakhs over 3 weeks. Now when I try to withdraw, they are demanding 20% tax fee. I think I've been scammed.",
                "scam_type": "Investment Scam",
                "confidence": 0.92,
                "urgency_level": "HIGH",
                "state": "Gujarat",
                "district": "Ahmedabad"
            },
            # OTP / Part time job
            {
                "text": "I received a message on Telegram offering a part-time job of liking YouTube videos for ₹50 per like. They paid me ₹150 first. Then they asked me to invest ₹5,000 for VIP tasks to earn ₹8,000. I did it, and then they asked for ₹30,000. I realized it is OTP / job fraud.",
                "scam_type": "Job Fraud",
                "confidence": 0.89,
                "urgency_level": "MEDIUM",
                "state": "Telangana",
                "district": "Hyderabad"
            },
            # Sextortion / Threat
            {
                "text": "Got a WhatsApp video call from a girl, when I picked up she was undressing. She hung up and sent a screen recording of my face alongside the video. Threatening to upload it to YouTube and Facebook, and send to my family contacts if I don't pay ₹50,000.",
                "scam_type": "Sextortion",
                "confidence": 0.97,
                "urgency_level": "CRITICAL",
                "state": "Rajasthan",
                "district": "Jaipur"
            }
        ]
        
        # Expand complaints with synthetic entries to reach 50 records
        scam_types = ["Digital Arrest", "KYC Fraud", "FedEx Parcel Scam", "OTP Fraud", "Investment Scam", "Romance Scam", "Job Fraud", "Loan App Fraud", "Fake Customer Care", "Sextortion"]
        states = ["Delhi", "Maharashtra", "Karnataka", "Telangana", "Tamil Nadu", "West Bengal", "Uttar Pradesh", "Bihar", "Gujarat", "Rajasthan", "Punjab"]
        districts = {
            "Delhi": ["New Delhi", "South Delhi", "West Delhi"],
            "Maharashtra": ["Mumbai", "Pune", "Thane", "Nagpur"],
            "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru"],
            "Telangana": ["Hyderabad", "Warangal", "Secunderabad"],
            "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
            "West Bengal": ["Kolkata", "Howrah", "Darjeeling"],
            "Uttar Pradesh": ["Noida", "Lucknow", "Kanpur"],
            "Bihar": ["Patna", "Gaya", "Muzaffarpur"],
            "Gujarat": ["Ahmedabad", "Surat", "Vadodara"],
            "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"]
        }
        
        for c in complaints:
            comp = ScamComplaint(
                complaint_text=c["text"],
                scam_type=c["scam_type"],
                confidence=c["confidence"],
                urgency_level=c["urgency_level"],
                state=c["state"],
                district=c["district"],
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 15))
            )
            self.db.add(comp)
            
        for i in range(44):
            st = random.choice(states)
            dst = random.choice(districts.get(st, ["District Center"]))
            scam = random.choice(scam_types)
            urg = random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
            
            comp = ScamComplaint(
                complaint_text=f"Suspected {scam} reported. Financial transaction initiated but blocked by alert system. State: {st}, District: {dst}.",
                scam_type=scam,
                confidence=random.uniform(0.65, 0.95),
                urgency_level=urg,
                state=st,
                district=dst,
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 60))
            )
            self.db.add(comp)
            
        self.db.commit()

    def _generate_ficn_seizures(self):
        # Generate Fake Indian Currency Note (FICN) data modeled after RBI Annual Reports
        # Seizure rates: ₹500 (most common), ₹2000 (withdrawn but still circulating counterfeits), ₹200, ₹100
        seizures = []
        states = ["West Bengal", "Maharashtra", "Delhi", "Uttar Pradesh", "Tamil Nadu", "Telangana", "Assam"]
        districts = {
            "West Bengal": ["Malda", "Kolkata", "Murshidabad"],
            "Maharashtra": ["Mumbai", "Thane", "Pune"],
            "Delhi": ["New Delhi", "East Delhi"],
            "Uttar Pradesh": ["Ghaziabad", "Lucknow", "Varanasi"],
            "Tamil Nadu": ["Chennai", "Coimbatore"],
            "Telangana": ["Hyderabad", "Nizamabad"],
            "Assam": ["Guwahati", "Dhubri"]
        }
        
        # Coordinates in India
        coords = {
            "Malda": (25.0112, 88.1352),
            "Kolkata": (22.5726, 88.3639),
            "Mumbai": (19.0760, 72.8777),
            "New Delhi": (28.6139, 77.2090),
            "Ghaziabad": (28.6692, 77.4538),
            "Hyderabad": (17.3850, 78.4867),
            "Guwahati": (26.1445, 91.7362),
            "Thane": (19.2183, 72.9781),
            "Pune": (18.5204, 73.8567),
            "Murshidabad": (24.1820, 88.2721)
        }
        
        denominations = [100, 200, 500, 2000]
        
        # Generate 40 seizure records
        for i in range(40):
            st = random.choice(states)
            dst_list = districts.get(st, ["District Center"])
            dst = random.choice(dst_list)
            denom = random.choice(denominations)
            count = random.randint(5, 500)
            
            # Geographic jitter
            base_coord = coords.get(dst, (20.5937, 78.9629))
            lat = base_coord[0] + random.uniform(-0.15, 0.15)
            lng = base_coord[1] + random.uniform(-0.15, 0.15)
            
            # Generate fake serial number pattern
            serials = ",".join([f"9AA{random.randint(100000, 999999)}" for _ in range(min(5, count))])
            
            seizure = FICNSeizure(
                denomination=denom,
                count=count,
                state=st,
                district=dst,
                latitude=lat,
                longitude=lng,
                serial_numbers=serials,
                is_fake=True,
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 90))
            )
            self.db.add(seizure)
            
        self.db.commit()

    def _generate_crime_incidents(self):
        # Generate cybercrime incidents for general mapping (NCRB calibrated density)
        incidents = []
        crime_types = ["UPI Fraud", "Digital Arrest", "Phishing", "Identity Theft", "Sextortion", "Loan App Scams"]
        states = ["Karnataka", "Telangana", "Maharashtra", "Delhi", "Uttar Pradesh", "Jharkhand", "West Bengal", "Rajasthan"]
        districts = {
            "Karnataka": ["Bengaluru", "Mysuru"],
            "Telangana": ["Hyderabad", "Secunderabad"],
            "Maharashtra": ["Mumbai", "Pune"],
            "Delhi": ["New Delhi", "South Delhi"],
            "Uttar Pradesh": ["Noida", "Ghaziabad"],
            "Jharkhand": ["Jamtara", "Ranchi", "Deoghar"],
            "West Bengal": ["Kolkata", "Bidhannagar"],
            "Rajasthan": ["Jaipur", "Alwar"]
        }
        
        coords = {
            "Bengaluru": (12.9716, 77.5946),
            "Mysuru": (12.2958, 76.6394),
            "Hyderabad": (17.3850, 78.4867),
            "Mumbai": (19.0760, 72.8777),
            "Pune": (18.5204, 73.8567),
            "New Delhi": (28.6139, 77.2090),
            "Noida": (28.5355, 77.3910),
            "Jamtara": (23.9620, 86.8023), # Infamous Jamtara cyber cluster
            "Kolkata": (22.5726, 88.3639),
            "Jaipur": (26.9124, 75.7873),
            "Alwar": (27.5530, 76.6089)
        }
        
        for i in range(120):
            st = random.choice(states)
            dst_list = districts.get(st, ["District Center"])
            dst = random.choice(dst_list)
            crime = random.choice(crime_types)
            sev = random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
            
            base_coord = coords.get(dst, (20.5937, 78.9629))
            lat = base_coord[0] + random.uniform(-0.25, 0.25)
            lng = base_coord[1] + random.uniform(-0.25, 0.25)
            
            inc = CrimeIncident(
                crime_type=crime,
                severity=sev,
                description=f"Citizen reported fraud case involving {crime}. Investigations active.",
                state=st,
                district=dst,
                latitude=lat,
                longitude=lng,
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 90))
            )
            self.db.add(inc)
            
        self.db.commit()

    def _generate_alerts(self):
        # Generate some live alerts across modules for the websocket feed
        alerts = [
            Alert(
                module="graph",
                alert_type="Mule Ring Activity",
                title="Coordinated Loop Detected (Ring #7)",
                description="Louvain analysis flagged 23 inter-connected accounts showing circular transactional velocity.",
                severity="CRITICAL",
                status="PENDING"
            ),
            Alert(
                module="scam",
                alert_type="Digital Arrest Impersonation",
                title="Active Scam Session in Delhi",
                description="Digital arrest signature matches CBI impersonation keywords in progress.",
                severity="HIGH",
                status="PENDING"
            ),
            Alert(
                module="currency",
                alert_type="FICN Counterfeit Seizure",
                title="Fake ₹500 Note Detected in Mumbai",
                description="Watermark and serial number check failed at Bank Terminal Mumbai-4.",
                severity="MEDIUM",
                status="PENDING"
            ),
            Alert(
                module="map",
                alert_type="Cybercrime Spurt",
                title="Jamtara Corridor Alert",
                description="300% surge in localized UPI phishing complaints detected over the past 48h.",
                severity="HIGH",
                status="PENDING"
            )
        ]
        for a in alerts:
            self.db.add(a)
        self.db.commit()

    def _generate_cases(self):
        cases = [
            Case(
                case_id="VYUH-2026-007",
                type="Mule Ring",
                risk_score=94.2,
                accounts_flagged=23,
                est_loss=4520000.0,
                status="OPEN",
                generated_fir_draft="""FIRST INFORMATION REPORT (Under Section 154 CrPC)
1. District: New Delhi, Cyber Police Station
2. Case Ref: VYUH-2026-007
3. Acts: Sections 419, 420 IPC r/w Section 66D IT Act (Impersonation, Cheating, and Identity Theft)
4. Suspect Details: 23 Coordinated Mule Accounts linked to Ring ID #7. Primary Central Node ID: 9876543201 (Mule Owner 1).
5. Incident Summary: The AI platform VYUH detected topological signatures matching structured cash routing (loop structure) across 23 accounts. Aggregate diverted volume estimated at ₹45.2 Lakhs. Immediate debit freeze is requested on all flagged nodes.
6. Evidence Catalog: Graph homology signature, Louvain Community 7 map, IP access logs from 192.168.4.*, and registered mobile numbers (+919876500001 to +919876500023).""",
                evidence_data=json.dumps({
                    "ring_id": 7,
                    "primary_suspect": "Mule Owner 1",
                    "accounts": [f"98765432{i:02d}" for i in range(1, 24)],
                    "total_loss": 4520000.0,
                    "centrality_score": 0.96,
                    "homology_cycles": 12
                })
            ),
            Case(
                case_id="VYUH-2026-012",
                type="Digital Arrest Syndicate",
                risk_score=87.5,
                accounts_flagged=3,
                est_loss=1200000.0,
                status="UNDER_INVESTIGATION",
                generated_fir_draft="FIR Draft for Digital Arrest Scam",
                evidence_data=json.dumps({"complaint_ref": "COMP-9293", "scam_type": "Digital Arrest"})
            ),
            Case(
                case_id="VYUH-2026-015",
                type="FICN Counterfeit Ring",
                risk_score=78.1,
                accounts_flagged=5,
                est_loss=340000.0,
                status="CLOSED",
                generated_fir_draft="Closed Case report on FICN seizure in Malda border points",
                evidence_data=json.dumps({"seizure_count": 680, "denomination": 500})
            )
        ]
        for c in cases:
            self.db.add(c)
        self.db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    gen = VYUHDataGenerator(db)
    print("Generating synthetic seed data...")
    gen.generate_all()
    print("Seed data successfully generated!")
    db.close()
