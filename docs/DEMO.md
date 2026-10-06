# DonateConnect Local Demo Guide

Follow these steps to manually walk through the real, end-to-end flow.

## 1. Start the System
Run the local demo script:
```powershell
.\scripts\start-local-demo.ps1
```
This script ensures ports are available, starts the Spring Boot backend using the `e2e` in-memory H2 database profile, and launches the Vite frontend.

## 2. Seeded Accounts
The system is seeded with the following accounts (Password: `pass123`):
- **Donor:** priya.patel@gmail.com
- **NGO Manager:** contact@goonj.org
- **Volunteer (Courier):** vikram.s@gmail.com

## 3. The End-to-End Flow

### Phase 1: Donor Requests Donation
1. Navigate to `http://localhost:5173`
2. **Login as Donor** (`priya.patel@gmail.com`).
3. Click **"New Donation"** -> Select **"Goonj Foundation"** -> Category: **Clothes**.
4. Fill out the description, address, and click **Submit**.
5. Log out.

### Phase 2: NGO Accepts Donation
1. **Login as NGO Manager** (`contact@goonj.org`).
2. Go to the **Dashboard**. You will see the incoming donation from Priya Patel in the "REQUESTED" state.
3. Click the **Accept** button. The status changes to "ACCEPTED".
4. Log out.

### Phase 3: Volunteer Claims Delivery
1. **Login as Volunteer** (`vikram.s@gmail.com`).
2. Go to the **Driver Dashboard**.
3. Under the "Available Pickups" tab, locate the donation.
4. Click **"Claim Pickup"**.
   - Under the hood, this securely assigns the `VolunteerTask` and generates exactly one `Delivery` record containing a unique OTP.
5. The donation moves to your "My Deliveries" tab (status: `IN_TRANSIT`).

### Phase 4: Route Tracking & Live Location
1. Click **"Simulate Route"**.
2. This opens the `TrackDeliveryPage`, which establishes a WebSocket (STOMP) connection.
3. GPS coordinates are simulated and sent to the backend endpoint `/api/deliveries/{deliveryId}/location`.
4. (*Optional*) If you log in as the donor in an incognito window, you can view the live truck icon moving on the map.

### Phase 5: Delivery Completion via OTP
1. Ask the NGO Manager for the OTP (or check the NGO dashboard's "Show OTP" button if implemented, otherwise simulate by observing backend logs/DB).
2. On the Volunteer's `TrackDeliveryPage`, upload a photo proof of delivery and enter the **6-digit OTP**.
3. Click **"Complete Delivery"**.
4. The system validates the OTP. If valid, the Delivery is marked `COMPLETED` and the Donation is officially marked `DELIVERED`!
