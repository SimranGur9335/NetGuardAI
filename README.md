# NetGuard AI

AI-Powered Network Intrusion Detection & Threat Classification Platform

## Overview

NetGuard AI is a network security monitoring platform that detects, classifies, and alerts on suspicious network traffic. The system uses machine learning models to identify potential security threats including DoS/DDoS attacks, brute force attempts, and port scanning activity.

## Current Status

This build features **real packet capture** with the following characteristics:

- **Frontend**: React application with login, protected routes and live monitoring controls
- **Backend**: REST API with JWT authentication and in-memory data storage
- **Data Source**: Real network packets captured via **tshark (Wireshark) over Npcap**
- **Detection**: Development Detection Engine (rule-based flow analysis — not a trained ML model)
- **Database**: None (bounded in-memory repositories only)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Dashboard │ │ Traffic  │ │ Alerts   │ │ Threats  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ REST API
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Detection │ │Threat    │ │ Alert    │ │Dashboard │       │
│  │Service   │ │Classifier│ │Service   │ │Service   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                            │                                │
│  ┌──────────────────────────────────────────────────┐      │
│  │         In-Memory Repositories                     │      │
│  │  (Traffic, Alerts, Predictions, Statistics)      │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
NetGuard/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── layouts/         # App layout and navigation
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client and service layer
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main application component
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js + TypeScript + Express
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Domain models and types
│   │   ├── repositories/    # Data access layer
│   │   │   ├── interfaces/  # Repository interfaces
│   │   │   └── memory/      # In-memory implementations
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- **Npcap** — https://npcap.com/ (enable "Install Npcap in WinPcap API-compatible Mode")
- **Wireshark/tshark** — https://www.wireshark.org/ (tshark must be on the PATH or installed in `C:\Program Files\Wireshark`)

If Npcap or tshark is missing, the API honestly reports
`Packet Capture: Unavailable` and **no traffic data is generated** — there is
no simulation or fallback data.

Verify capture capability:

```bash
tshark -D          # should list Npcap interfaces
```

### Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend will start on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

All endpoints except `/api/health` and `POST /api/auth/login` require a JWT
(`Authorization: Bearer <token>`). Start/stop monitoring, interface selection and
alert acknowledge/resolve additionally require the ADMIN role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user (auth) |
| POST | `/api/auth/logout` | Logout (auth) |
| GET | `/api/health` | Health check (public) |
| GET | `/api/system/status` | System component status (auth) |
| GET | `/api/dashboard/summary` | Dashboard overview data (auth) |
| GET | `/api/traffic` | List traffic events (auth) |
| GET | `/api/traffic/activity` | Traffic activity timeline (auth) |
| GET | `/api/traffic/:id` | Get traffic event by ID (auth) |
| GET | `/api/alerts` | List security alerts (auth) |
| GET | `/api/alerts/counts` | Alert counts by status (auth) |
| GET | `/api/alerts/:id` | Get alert by ID (auth) |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert (admin) |
| PATCH | `/api/alerts/:id/resolve` | Resolve alert (admin) |
| GET | `/api/threats` | List threat categories (auth) |
| GET | `/api/threats/:category` | Get threat category details (auth) |
| GET | `/api/models` | List models (auth) |
| GET | `/api/models/evaluation` | Evaluation status (auth) |
| GET | `/api/models/:id/evaluation` | Model evaluation details (auth) |
| GET | `/api/monitoring/interfaces` | Discover capture interfaces (auth) |
| GET | `/api/monitoring/status` | Capture status (auth) |
| POST | `/api/monitoring/start` | Start real capture `{interfaceId}` (admin) |
| POST | `/api/monitoring/stop` | Stop real capture (admin) |

## Current Threat Categories

- **DoS/DDoS**: SYN-flood signatures (>=80 SYNs from one source to one destination per second)
- **Brute Force**: >=15 connection attempts to one auth-service port (SSH/RDP/SMB/FTP/DB) within 30s
- **Port Scan**: >=15 distinct ports probed on one destination, or >=25 distinct destination ports from one source within 10s

## Real Packet Capture

The capture pipeline (no simulation anywhere):

```
tshark/Npcap capture → PacketNormalizer → FeatureExtractor →
DetectionService (Development Detection Engine) → ThreatClassificationService →
AlertService → in-memory repositories → REST API → React dashboard
```

- Interfaces are discovered with `tshark -D` (Npcap devices) and enriched via `Get-NetAdapter`
- Capture runs as a real tshark child process; stopping kills the process tree
- Alerts are generated only from real captured packets and are de-duplicated
  (one alert per category/endpoints per 2 minutes)
- In-memory repositories are bounded (oldest events are dropped beyond the cap)

## ML / Detection Honesty

The active detector is the **Development Detection Engine** — rule-based flow
analysis. It is **not** a trained machine learning model. Random Forest and
XGBoost are listed as `Not Trained`, and all evaluation metrics (accuracy,
precision, recall, F1, confusion matrix) are reported as
**Not Trained / Not Available** — never fabricated.

## Future Integration Points

### Real ML Models

The detection interface supports model swapping:

```typescript
// Current: rule-based development engine
const detector = new FlowBasedDetectionModel();

// Future: trained ML model
const detector = new RandomForestModel(modelPath);
```

## Model Evaluation

**Status: Not Trained / Not Available**

No experimental results exist. Metrics will only be populated after:
1. Dataset collection and preparation
2. Model training
3. Experimental evaluation

## License

MIT
