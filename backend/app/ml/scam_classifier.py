import re
from typing import Dict, Any, List

class ScamClassifier:
    def __init__(self):
        # Multilingual agency keywords mapping
        self.keywords = {
            "Digital Arrest": [
                r"\bdigital arrest\b", r"\bcyber cell\b", r"\bcbi\b", r"\bcentral bureau\b",
                r"\bed\b", r"\benforcement directorate\b", r"\bcustoms\b", r"\bnarcotics\b",
                r"\bpolice\b", r"\bgiraftar\b", r"\bkaid\b", r"\bskype\b", r"\bvideo call\b",
                r"डिजिटल अरेस्ट", "सीबीआई", "पुलिस", "नारकोटिक्स", "गिरफ्तार", "अधिकारी", "कस्टम"
            ],
            "FedEx Parcel Scam": [
                r"\bfedex\b", r"\bdhl\b", r"\bparcel\b", r"\bcourier\b", r"\bpassport\b",
                r"\bcontraband\b", r"\bmdma\b", r"\bdrugs\b", r"\bweed\b", r"\billegal parcel\b",
                "पार्सल", "कुरियर", "ड्रग्स", "दवाई", "पासपोर्ट"
            ],
            "KYC Fraud": [
                r"\bkyc\b", r"\bupdate kyc\b", r"\baccount block\b", r"\bsbi-kyc\b",
                r"\bnetbanking\b", r"\bsms link\b", r"\bpan update\b", r"\bcredit card update\b",
                "केवाईसी", "खाता ब्लॉक", "पैन अपडेट", "एसएमएस लिंक"
            ],
            "Investment Scam": [
                r"\binvestment\b", r"\bipo\b", r"\bshares\b", r"\bprofit\b", r"\bgs-trade\b",
                r"\btrading academy\b", r"\bcrypto trading\b", r"\bdouble money\b",
                "निवेश", "आईपीओ", "शेयर", "मुनाफा", "ट्रेडिंग", "क्रिप्टो"
            ],
            "Job Fraud": [
                r"\bpart time job\b", r"\byt likes\b", r"\byt subscribe\b", r"\btelegram task\b",
                r"\bearn money online\b", r"\bwork from home\b", r"\bsalary daily\b",
                "पार्ट टाइम जॉब", "यूट्यूब लाइक", "टास्क", "वर्क फ्रॉम होम"
            ],
            "OTP Fraud": [
                r"\botp\b", r"\bone time password\b", r"\bshare otp\b", r"\bverification code\b",
                "ओटीपी", "वन टाइम पासवर्ड", "कोड"
            ],
            "Sextortion": [
                r"\bwhatsapp video call\b", r"\bundress\b", r"\bnude\b", r"\bblackmail\b",
                r"\byoutube upload\b", r"\bcontacts share\b", r"\bsextortion\b",
                "अश्लील", "ब्लैकमेल", "वीडियो कॉल", "यूट्यूब अपलोड", "इज्जत"
            ],
            "Loan App Fraud": [
                r"\bloan app\b", r"\binstant loan\b", r"\bharassment\b", r"\binterest rate\b",
                r"\bcontacts leak\b", r"\bphotoshopped\b",
                "लोन ऐप", "लोन चुकाना", "ब्याज", "धमकी", "तस्वीरें"
            ],
            "Fake Customer Care": [
                r"\bcustomer care\b", r"\bhelpline number\b", r"\bsearch google\b", r"\btoll free\b",
                r"\banydesk\b", r"\bteamviewer\b",
                "कस्टमर केयर", "टोल फ्री", "एनीडेस्क", "टीमव्यूअर"
            ],
            "Romance Scam": [
                r"\bforeigner friend\b", r"\bgift customs\b", r"\bsend money package\b",
                r"\blove\b", r"\bmarriage bureau\b",
                "विदेशी दोस्त", "उपहार सीमा शुल्क", "प्यार"
            ]
        }

    def classify_complaint(self, text: str) -> Dict[str, Any]:
        """
        Classifies a complaint text into scam categories using multilingual keywords.
        """
        text_lower = text.lower()
        scores = {}
        
        for category, patterns in self.keywords.items():
            score = 0
            for pattern in patterns:
                # Count matches
                matches = len(re.findall(pattern, text_lower))
                score += matches
            scores[category] = score
            
        # Get highest category
        max_category = max(scores, key=scores.get)
        max_score = scores[max_category]
        
        # If no keywords matched, fall back to general categorization or "Unknown Scam"
        if max_score == 0:
            # Look for general fraud indicators
            if any(k in text_lower for k in ["paisa", "rupee", "bank", "link", "transfer"]):
                max_category = "KYC Fraud"
                confidence = 0.45
            else:
                max_category = "Digital Arrest"  # Default fallback for demo
                confidence = 0.50
        else:
            # Calculate simple confidence
            total_score = sum(scores.values())
            confidence = min(0.98, 0.5 + (max_score / (total_score + 1)) * 0.48)
            
        urgency = "LOW"
        if max_category in ["Digital Arrest", "Sextortion", "FedEx Parcel Scam"]:
            urgency = "CRITICAL"
        elif max_category in ["KYC Fraud", "Investment_Scam", "Loan App Fraud"] or confidence > 0.8:
            urgency = "HIGH"
        elif confidence > 0.6:
            urgency = "MEDIUM"
            
        # Construct suggestions
        suggestions = {
            "Digital Arrest": "Do not transfer any money. Law enforcement agencies never arrest or investigate via Skype or video calls. Call the cyber helpline at 1930 immediately.",
            "FedEx Parcel Scam": "Customs officers do not make calls demanding transfer of money. Block the number and file an official complaint. Do not share your Aadhaar card copy.",
            "KYC Fraud": "Do not click links in SMS. Banks never ask for password or OTP via links. Contact your branch directly to verify.",
            "Investment Scam": "Avoid unregulated investment advisory groups. If promised abnormally high returns, it is a scam. Verify apps on SEBI's website.",
            "Job Fraud": "Initial small payouts are bait. Never pay money to secure a job or complete paid tasks. Do not transfer funds.",
            "Sextortion": "Do not pay. Deactivate social media profiles temporarily, do not reply to blackmailers, report the numbers and call the helpline.",
            "Loan App Fraud": "Verify if the app is RBI registered. Never grant access to contacts. Report harassment immediately.",
            "OTP Fraud": "Never share OTP with anyone under any circumstances, even if they claim to be from bank or courier.",
            "Fake Customer Care": "Never download screen sharing tools like AnyDesk or TeamViewer at the request of customer care representatives.",
            "Romance Scam": "Never send money to someone you only met online, especially for clearing customs duties on alleged gifts."
        }
        
        return {
            "scam_type": max_category,
            "confidence": round(confidence, 2),
            "urgency_level": urgency,
            "recommended_action": suggestions.get(max_category, "Immediately report to your bank and call 1930 Cybercrime Helpline.")
        }

    def analyze_call_metadata(self, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input: call duration, spoof prefix, time of day, transfer timing
        Output: composite risk score, alert level
        """
        duration = call_data.get("duration", 0)  # in minutes
        prefix = call_data.get("caller_prefix", "")  # e.g., +91911, +92, etc.
        time_hour = call_data.get("time_hour", 12)  # 0-23
        transfer_proximity = call_data.get("transfer_proximity", 999)  # minutes to UPI transaction request
        
        score = 10.0
        indicators = []
        
        # Spoofed Prefix / International Prefix
        if prefix.startswith("+92") or prefix.startswith("+234"):
            score += 35
            indicators.append("International fraud origin prefix")
        elif prefix in ["+91911", "+91112", "CBI_SPOOF"]:
            score += 45
            indicators.append("Emergency/Government spoofed agency prefix")
            
        # Extended Call Duration (Digital Arrest calls are typically very long)
        if duration > 120:  # > 2 hours
            score += 25
            indicators.append("Abnormally high call duration (>120 mins) matching digital arrest")
        elif duration > 30:
            score += 15
            indicators.append("Prolonged call duration (>30 mins)")
            
        # Transaction request in close proximity
        if transfer_proximity < 15:
            score += 30
            indicators.append("UPI transfer requested during or immediately after call")
        elif transfer_proximity < 60:
            score += 15
            indicators.append("UPI transfer requested within 1 hour of call")
            
        # Time of day patterns (Peak fraud hours)
        if (10 <= time_hour <= 14) or (20 <= time_hour <= 23):
            score += 5
            indicators.append("Call placed during peak fraud operational hours")
            
        score = min(100.0, score)
        
        alert_level = "LOW"
        if score > 80:
            alert_level = "CRITICAL"
        elif score > 60:
            alert_level = "HIGH"
        elif score > 35:
            alert_level = "MEDIUM"
            
        return {
            "risk_score": score,
            "alert_level": alert_level,
            "indicators": indicators,
            "action": "Immediate Intervention: Intercept UPI channel / Notify subscriber" if score > 75 else "Monitor account transactions"
        }
