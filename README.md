# VYUH (विघ्न) — Digital Public Safety Intelligence Platform

VYUH (विघ्न — meaning "disruption/obstacle" — we disrupt fraud before it disrupts citizens) is an AI-powered Digital Public Safety Intelligence platform built for the **ET AI Hackathon 2.0, Problem Statement 6**: *"AI for Digital Public Safety: Defeating Counterfeiting, Fraud & Digital Arrest Scams."*

---

## 🛠 Technology Stack

*   **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Recharts (Charts), D3.js (Force-directed network graphs), React-Leaflet + Leaflet (Crime map overlays), Framer Motion.
*   **Backend**: FastAPI (Python), SQLAlchemy, SQLite (local file-based engine fallback), NetworkX (TDA cycle homology & Louvain communities calculation).
*   **AI/ML Stack**: Text pattern heuristics, CV image check pipelines (OpenCV), Local semantic RAG (TF-IDF vector matching + Groq / Gemini API wrappers).

---

## 🏗 Application Architecture Diagram

```
                        +------------------------------------------+
                        |             VYUH React Client            |
                        |      (Dashboard, Maps, Graphs, Chats)     |
                        +--------------------+---------------------+
                                             |
                                  HTTPS / WSS (Port 5173)
                                             |
                                             v
                        +--------------------+---------------------+
                        |          FastAPI API Gateway             |
                        |      (API Routes, WS Alert Manager)      |
                        +---+----------------+------------------+--+
                            |                |                  |
                            v                v                  v
                 +----------+----+   +-------+---------+   +----+----------+
                 | SQLite DB     |   | NetworkX Graph  |   | ML Engine     |
                 | (Transacts,   |   | (Louvain Comm,  |   | (RAG, OpenCV, |
                 | Alerts, Cases)|   | Betti Homology) |   | Call Scorer)  |
                 +---------------+   +-----------------+   +---------------+
```

---

## 🌟 Core Modules

### 1. Fraud Network Graph (Mule Ring Detection)
*   **Louvain Community Clustering**: Groups UPI transactions to segment suspect coordination structures.
*   **Topological Homology (TDA)**: Computes 1D Betti cycle count indicators (Euler Characteristic) to recognize money loops.
*   **Centrality Scoring**: Evaluates PageRank coordinates to flag distribution accounts.

### 2. Digital Arrest Scam Detector
*   **Call Telemetry Profiling**: Evaluates duration spikes (>120 mins), emergency telecom prefixes (+91911), and timing windows.
*   **Multilingual Script Parsing**: Lexical checking on CBI/ED/Customs threat scripts in Hindi and English.
*   **Interception Simulator**: Stepper displaying early alerts at step 5 before the final financial routing at step 7.

### 3. Counterfeit Currency Verifier
*   **OVI Color-Shift Analysis**: Simulates angle shifts from green to blue under tilted optics.
*   **Checks Matrix**: Scans Serial Numbers format, Watermarks, bleed line counts, and microprint clarity.
*   **PDF Seizure Exporter**: Automatically formats seizure logs into printer-ready case sheets.

### 4. Citizen Fraud Shield (AI Chatbot)
*   **Conversational Assistant**: Multi-language de-escalation tips (English/Hindi).
*   **Crisis Protocol Banner**: Triggering "Emergency" locks down UI, highlights helplines (1930), and prints quick directives.
*   **URL Phishing Check**: Tests links and SMS prefixes against known bad lists.

### 5. Geospatial Crime Intelligence Map
*   **Pulsing Hotspots**: Displays temporal densities forecasting cybercrime spiels.
*   **Fraud Corridors**: Displays inter-state money movement flow paths.
*   **Tactical dispatch recommendation**: District lookup for local patrol scheduling.

---

## 🔄 Tactical Investigation Pipeline (VTIP)

Rather than isolated modules, VYUH operates as a continuous, unified cybercrime tracing pipeline:
1. **Case Intake**: Escalate live alarm feeds or chat transcripts. Generates a unique **Case ID** (e.g. `VYUH-2026-X`) and passes data forward.
2. **Scam Classification**: Auto-analyzes call transcripts and emergency telemetry vectors.
3. **Mule Homology**: Traces coordinated mule ring communities in a D3 force-directed graph.
4. **Geospatial Dispatches**: Localizes coordinates on Leaflet GIS maps, recommending police cell dispatches.
5. **Evidence Locking**: Digitally seals the investigation with Section 65B compliance hashes and printable legal court dossiers.

---

## 🚀 Hackathon Distinguishing Features

VYUH introduces ten advanced capabilities that elevate it above standard submissions:
1. **Police Copilot**: A floating command line terminal (`Copilot CLI`) pinned across all pages supporting commands (`/trace`, `/dispatch`, `/verify`, `/clear`, `/bns`).
2. **AI Investigation Agent**: The Copilot responds to general queries (e.g., *"What is Section 65B?"*, *"Explain Louvain Community"*) acting as an on-the-fly cyber law assistant.
3. **Live Threat Radar**: Sweeping radar canvas on the Dashboard displaying active alarm densities (Mewat, Jamtara).
4. **Deepfake Voice Detection Prototype**: Waveform canvas oscillator analyzing scam call audio to grade synthetic clones.
5. **Explainable AI (XAI)**: SHAP-based scorecard illustrating exactly why scripts are flagged as high risk.
6. **Fraud Network Replay**: Range timeline slider simulating coordination expansions day-by-day.
7. **Risk Score Engine**: Breaks down exact algebraic weights ($\text{PageRank} \times 40\% + \text{Loop Homology} \times 30\% + \text{Velocity} \times 30\%$).
8. **AI Case Timeline**: Chronological sidebar mapping chronological evidence vectors.
9. **AI Secure Evidence Locker**: Database vault storing cryptographic hashes and file hashes.
10. **AI-generated Investigation Report**: Admissible Section 65B print layout reports.

---

## ⚡ Setup & Run Instructions

### 🔑 Environment Variables Setup
Before starting, create a `.env` file inside the `backend/` directory to configure the LLM integration:
```env
GROQ_API_KEY=your_groq_api_key_here
```
*(If the Groq API key is not configured, the platform automatically switches to offline semantic RAG heuristics for text classification and de-escalation scripts).*

### Option 1: Docker Compose (Recommended)
Launch the entire stack with a single command:
```bash
docker-compose up --build
```
*   **Frontend client**: `http://localhost:5173`
*   **FastAPI backend**: `http://localhost:8000`
*   **Swagger API Docs**: `http://localhost:8000/docs`

### Option 2: Local Running (Direct)

#### 1. Start Backend
```bash
cd backend
pip install -r requirements.txt
python app/main.py
```

#### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Pre-Seeded Demo Data

To support testing, the database automatically seeds the following dataset on startup:
*   **Mule Ring #7**: A 23-node circular transaction loop (Acc IDs: `9876543201` to `9876543223`) mapping high risk scores.
*   **Mule Ring #3**: An 8-node suspicious group.
*   **Active Alarms**: 4 seeded logs displaying in the WebSocket feed.
*   **Seizure points**: Calibrated geography points mapped on real coordinates in India.
