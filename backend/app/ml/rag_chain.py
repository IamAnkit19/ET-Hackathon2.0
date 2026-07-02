import os
import requests
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings

class RAGChain:
    def __init__(self):
        # Local RAG knowledge base representing NCRB, RBI, and I4C guidelines
        self.knowledge_base = [
            {
                "title": "Digital Arrest Scam De-escalation Protocol",
                "content": "Official law enforcement officers and government departments (CBI, Customs, ED, Police) NEVER conduct investigations, arrest individuals, or place them under 'digital arrest' over video calls (Skype, WhatsApp). If someone claims your passport or parcel contains illegal drugs and demands you stay on a video call, it is a scam. Cut the call immediately. Report the incident on cybercrime.gov.in or call 1930 helpline.",
                "keywords": ["cbi", "customs", "ed", "digital arrest", "video call", "skype", "parcel", "arrest", "drugs"]
            },
            {
                "title": "1930 National Cybercrime Helpline",
                "content": "The National Cybercrime Helpline 1930 operates 24/7. If you have been defrauded online (UPI, Netbanking, debit card fraud), call 1930 within the 'golden hour' (first 2 hours). Police coordination officers can freeze transfer amounts at the recipient bank side before scammers cash out.",
                "keywords": ["1930", "helpline", "golden hour", "freeze", "money", "transaction", "bank", "upi"]
            },
            {
                "title": "KYC Verification SMS Fraud",
                "content": "Banks never send SMS containing links for KYC verification (e.g., sbi-kyc-update.net) or threaten immediate account suspension via messages. Never click on links in SMS, and never share OTP or netbanking passwords with anyone. Treat all urgent banking alerts as suspicious.",
                "keywords": ["kyc", "bank", "sms", "link", "update", "otp", "password", "blocked"]
            },
            {
                "title": "WhatsApp/Telegram Job & Investment scams",
                "content": "Beware of WhatsApp groups offering daily trade suggestions or IPO allotment shares. Unauthorized platforms like GS-Trade are fake. Similarly, Telegram jobs offering money to like YouTube videos are bait. They pay small amounts first and then demand massive deposits for VIP tasks.",
                "keywords": ["whatsapp", "telegram", "job", "investment", "shares", "ipo", "trading", "like", "money", "GS-Trade"]
            },
            {
                "title": "Sextortion and Online Blackmail",
                "content": "If you receive a video call from an unknown profile and are blackmailed with a recording of your face paired with obscene footage, do not pay. Scammers will continue to demand more money. Deactivate social media profiles, restrict comments, block the numbers, and submit a complaint under the 'Sextortion' category on cybercrime.gov.in.",
                "keywords": ["sextortion", "video call", "blackmail", "nude", "recording", "money", "contacts"]
            }
        ]
        
        # Initialize simple TF-IDF for retrieving chunks
        self.vectorizer = TfidfVectorizer()
        self.corpus = [item["content"] for item in self.knowledge_base]
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def retrieve_chunks(self, query: str, top_n: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieves relevant documents using cosine similarity on TF-IDF vectors.
        """
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = similarities.argsort()[::-1][:top_n]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.05: # Threshold
                results.append(self.knowledge_base[idx])
        return results

    def generate_response(self, message: str) -> Dict[str, Any]:
        # 1. Detect language (Simple English/Hindi check)
        is_hindi = any(char in message for char in ["क", "ख", "ग", "घ", "म", "ा", "ी", "े"]) or "maine" in message.lower() or "cbi officer" in message.lower()
        
        # 2. Retrieve context chunks
        chunks = self.retrieve_chunks(message)
        context = "\n".join([c["content"] for c in chunks])
        
        # 3. Choose inference engine
        if settings.GROQ_API_KEY:
            try:
                response_text = self._query_groq(message, context, is_hindi)
                return {
                    "response": response_text,
                    "language": "hi" if is_hindi else "en",
                    "retrieved_chunks": chunks,
                    "engine": "groq"
                }
            except Exception as e:
                pass # Fallback to local
                
        if settings.GEMINI_API_KEY:
            try:
                response_text = self._query_gemini(message, context, is_hindi)
                return {
                    "response": response_text,
                    "language": "hi" if is_hindi else "en",
                    "retrieved_chunks": chunks,
                    "engine": "gemini"
                }
            except Exception as e:
                pass # Fallback to local

        # Fallback Local Rule-based Generator
        response_text = self._generate_local_response(message, chunks, is_hindi)
        return {
            "response": response_text,
            "language": "hi" if is_hindi else "en",
            "retrieved_chunks": chunks,
            "engine": "local_nlp"
        }

    def _query_groq(self, message: str, context: str, is_hindi: bool) -> str:
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        prompt = self._get_system_prompt(context, is_hindi)
        data = {
            "model": "llama-3.1-70b-versatile",
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": message}
            ],
            "temperature": 0.2
        }
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=data, headers=headers, timeout=10)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]

    def _query_gemini(self, message: str, context: str, is_hindi: bool) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        prompt = self._get_system_prompt(context, is_hindi) + f"\n\nUser Question: {message}"
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        res = requests.post(url, json=data, headers=headers, timeout=10)
        res.raise_for_status()
        return res.json()["candidates"][0]["content"]["parts"][0]["text"]

    def _get_system_prompt(self, context: str, is_hindi: bool) -> str:
        lang = "Hindi" if is_hindi else "English"
        return f"""You are VYUH Fraud Shield, a helpful conversational AI assistant representing the National Cybercrime portal.
Your goal is to assist citizens with fraud safety, report verification, and crisis protocol in {lang}.

Context knowledge:
{context}

Guidelines:
1. Be direct, authoritative but comforting.
2. If the user mentions any immediate threat or scam in progress (e.g. fake police call, video call arrest), direct them to cut the call and dial 1930.
3. Keep responses structured (use bullet points for action steps).
4. Respond in {lang}.
"""

    def _generate_local_response(self, message: str, chunks: List[Dict[str, Any]], is_hindi: bool) -> str:
        message_lower = message.lower()
        
        # Check scam type matches
        is_digital_arrest = any(k in message_lower for k in ["cbi", "police", "customs", "narcotics", "skype", "arrest", "parcel", "arrested"])
        is_kyc = any(k in message_lower for k in ["kyc", "bank", "sms", "link", "update", "blocked"])
        is_job = any(k in message_lower for k in ["job", "investment", "task", "telegram", "earning", "gs-trade"])
        
        if is_hindi:
            if is_digital_arrest:
                return """🚨 **तत्काल सलाह: यह एक फर्जी 'डिजिटल अरेस्ट' घोटाला है!**

कृपया घबराएं नहीं। सीबीआई, पुलिस, या सीमा शुल्क (Customs) विभाग कभी भी व्हाट्सएप या स्काइप वीडियो कॉल पर जांच नहीं करते और न ही डिजिटल अरेस्ट करते हैं।

**आपको तुरंत यह कदम उठाने चाहिए:**
1. **कॉल तुरंत काट दें:** कॉल करने वाले का नंबर ब्लॉक करें।
2. **कोई पैसा ट्रांसफर न करें:** वे सरकारी अधिकारी नहीं हैं।
3. **1930 डायल करें:** तुरंत साइबर हेल्पलाइन नंबर 1930 पर फोन करें और घटना दर्ज कराएं।
4. **शिकायत दर्ज करें:** [cybercrime.gov.in](https://cybercrime.gov.in) पर शिकायत करें।

VYUH आपके साथ है, सुरक्षित रहें!"""
            elif is_kyc:
                return """🔒 **केवाईसी धोखाधड़ी चेतावनी!**

बैंक कभी भी आपके खाते को बंद करने की धमकी देने वाले लिंक एसएमएस के माध्यम से नहीं भेजते हैं।

**सुरक्षा उपाय:**
1. **लिंक पर क्लिक न करें:** किसी भी संदिग्ध एसएमएस लिंक को न खोलें।
2. **ओटीपी शेयर न करें:** अपना पासवर्ड, पिन या ओटीपी कभी किसी को न बताएं।
3. **हेल्पलाइन:** तुरंत साइबर धोखाधड़ी की रिपोर्ट 1930 पर करें और अपने बैंक को सूचित करें।"""
            else:
                return """🛡️ **VYUH फ्रॉड शील्ड सुरक्षा चेतावनी**

हमें आपका संदेश मिला। सुरक्षित रहने के लिए निम्नलिखित सावधानियों का पालन करें:
- अज्ञात लोगों द्वारा दिए गए पार्ट-टाइम जॉब के प्रस्तावों या टेलीग्राम निवेश समूहों से बचें।
- बिना जांच के किसी भी खाते में पैसा ट्रांसफर न करें।
- यदि आपके साथ कोई वित्तीय धोखाधड़ी हुई है, तो तुरंत **1930** पर कॉल करें (गोल्डन ऑवर में रिपोर्ट करने से बैंक खाता फ्रीज हो सकता है)।"""
        else:
            # English Response
            if is_digital_arrest:
                return """🚨 **CRITICAL ALERT: This is a Digital Arrest Scam!**

Government agencies (CBI, ED, Police, Customs) **NEVER** conduct investigations or arrest you over video calls (Skype/WhatsApp).

**Immediate Action Required:**
1. **HANG UP IMMEDIATELY:** Block the caller. Do not stay on the call.
2. **DO NOT TRANSFER FUNDS:** They are threatening you with fake charges (contraband package, money laundering).
3. **DIAL 1930:** Call the National Cybercrime Helpline immediately to freeze any money transfers.
4. **FILE REPORT:** Register your case on [cybercrime.gov.in](https://cybercrime.gov.in)."""
            elif is_kyc:
                return """🔒 **Bank KYC Update Scam Alert!**

Banks will never request password, PIN, or OTP changes through SMS links or threaten immediate blocking.

**Safety Steps:**
1. **DO NOT CLICK:** Ignore and delete any SMS claiming to update PAN/KYC.
2. **NEVER SHARE OTP:** Bank staff will never call to ask for OTP.
3. **REPORT:** Call 1930 or raise a dispute on your bank app if money is debited."""
            elif is_job:
                return """📈 **Job & Telegram Investment Group Scam Alert!**

If you joined a Telegram/WhatsApp group promising high profits on IPOs (e.g. GS-Trade) or money for liking videos, it is a fraud scheme.

**Safety Steps:**
1. **DO NOT DEPOSIT MORE:** Scammers block withdrawals and ask for 'taxes' to extract more money.
2. **EXIT GROUPS:** Block and report the administrators.
3. **REPORT:** File details on the cyber portal with transactions history."""
            else:
                return """🛡️ **VYUH Fraud Shield Guard**

We have processed your query. Please note:
- Government representatives never ask for payments online to 'verify innocence'.
- Report any unauthorized transactions to **1930** immediately.
- Block any unknown numbers attempting suspicious calls or UPI collection requests."""
