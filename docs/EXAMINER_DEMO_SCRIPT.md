# 🚀 DonateConnect: Live Project Demonstration Guide for Examiners
### Step-by-Step Viva Examination Walkthrough

---

## 1. Quick Start Commands
Run the entire platform locally using the batch scripts in the project root:
```powershell
# Option A: Start both Backend and Frontend in one go:
.\start-all.bat

# Option B: Run separately:
# Terminal 1 (Backend - Port 8080):
cd backend
mvn spring-boot:run

# Terminal 2 (Frontend - Port 5173):
cd frontend
npm run dev
```

The Web Application is accessible at `http://localhost:5173`  
The REST Backend API is accessible at `http://localhost:8080/api`  
API Health Check: `http://localhost:8080/api/health`

---

## 2. Pre-Configured Test Personas & Login Credentials

| Role | Email | Password | What to Showcase to Examiner |
|---|---|---|---|
| **Donor** | `priya.patel@gmail.com` | `donor123` | Create donation with photo, view donation timeline, mobile cards |
| **NGO Partner** | `contact@goonj.org` | `ngo123` | Incoming donation approval queue, view delivery OTP, Urgent Needs |
| **Volunteer Driver** | `dispatch@donateconnect.in` | `driver123` | Claim pickup, live GPS route map, enter OTP, submit delivery proof photo |
| **Corporate CSR** | `csr@tata.com` | `corporate123` | Large-scale CSR donation drive creation, corporate impact metrics |
| **System Admin** | `admin@donateconnect.in` | `admin123` | Approve NGOs, audit system activity, inspect Blockchain Ledger |

---

## 3. High-Impact Demonstration Sequence (5 Minutes)

### Step 1: Donor Experience & Mobile View
1. Open `http://localhost:5173/login` in Google Chrome / Edge.
2. Open DevTools (`F12`) and switch to **Mobile Device Mode** (e.g., iPhone 14 Pro / Samsung Galaxy).
3. Log in as Donor (`priya.patel@gmail.com` / `donor123`).
4. Click **Create Donation**:
   - Select Category: `CLOTHES` or `FOOD`.
   - Title: "Winter Blankets and Clean Sweaters (15 units)".
   - Upload a sample picture.
   - Address: "MG Road, Bengaluru".
   - Notice the geocoding resolving coordinates automatically!
5. Submit the donation. Show the newly created card with status badge `REQUESTED`.

### Step 2: NGO Review & Secret OTP Generation
1. Open an Incognito window and log in as NGO (`contact@goonj.org` / `ngo123`).
2. Show the incoming request appearing on the NGO dashboard.
3. Click **Accept**.
4. Show the secret 6-digit Delivery OTP generated on the NGO screen (e.g. `842913`). Explain to the examiner that *only the NGO knows this code*.

### Step 3: Volunteer Driver Console & Live GPS Navigation
1. Open another tab and log in as Volunteer Driver (`dispatch@donateconnect.in` / `driver123`).
2. Show the **Driver Dashboard**:
   - Switch to **Available Pickups** tab.
   - Click **Claim Pickup**.
3. Open the **Track Delivery / Route Map** screen:
   - Point out the interactive Leaflet map rendering donor pickup location, destination NGO, and the live driver icon.
   - Show simulated live GPS telemetry updating coordinates.
4. Arrive at destination:
   - Ask the NGO for the 6-digit OTP and enter it.
   - Attach a proof-of-delivery photograph.
   - Click **Complete Delivery**.
5. The delivery status immediately transitions to `DELIVERED`.

### Step 4: Cryptographic Blockchain Ledger Verification
1. Navigate to `http://localhost:5173/blockchain` (or click **Blockchain Ledger** in the navigation).
2. Point out the newly minted block at the top of the chain:
   - Show the sequential `Block Index`.
   - Show that `previousHash` matches the hash of the earlier block.
   - Show the 64-character SHA-256 cryptographic hash.
   - Emphasize to the examiner: *"Because each block cryptographically incorporates the previous block's hash, any unauthorized modification to past donations is mathematically impossible without breaking the entire chain!"*
