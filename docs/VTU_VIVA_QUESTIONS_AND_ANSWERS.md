# 🎯 DonateConnect: VTU Viva-Voce Examination Preparation Guide
### Comprehensive Q&A Bank for External Examiners (B.E. 8th / 7th Semester Project)

---

## SECTION 1: ARCHITECTURE & SYSTEM DESIGN

### Q1. What is the high-level architecture of DonateConnect, and why did you choose a 3-tier architecture?
**Answer:**  
DonateConnect follows a **3-Tier Distributed Architecture**:
1. **Presentation / Client Tier:** Omni-channel client layer featuring a responsive Single Page Application (React 18, Vite, TypeScript) for desktop web and a Mobile Client (camera capture, assisted GPS tracking, swipeable cards) for donors and field volunteers.
2. **Business / Service Tier:** Enterprise Spring Boot 3.4.2 microservice layer running on Java 21 LTS, implementing stateless JWT authentication, Spring Security 6 RBAC, Haversine geospatial proximity sorting, and an internal SHA-256 blockchain hashing service.
3. **Data Persistence Tier:** PostgreSQL 16 (cloud-native Neon Serverless / local instance) with JPA/Hibernate ORM, alongside local/cloud object storage for photographs.

*Why 3-Tier?* It enforces strict separation of concerns, ensures loose coupling, allows independent scaling of the frontend and backend, and enhances security because the client layer never touches the database directly.

---

### Q2. How is the Mobile Application integrated with the Web Platform? Do they share the same backend?
**Answer:**  
Yes, both the **Mobile Application** and the **Web Dashboard** are decoupled clients that consume the exact same **RESTful API endpoints** exposed by the Spring Boot backend (`/api/*`).  
- The mobile app leverages native hardware APIs: `navigator.mediaDevices.getUserMedia` / mobile camera APIs for doorstep item verification and `navigator.geolocation.watchPosition` for streaming live driver GPS coordinates (`lastLat`, `lastLng`) every 15 seconds.
- Both clients use the same `Authorization: Bearer <JWT>` token header for session authentication, ensuring seamless interoperability and consistent user data across devices.

---

### Q3. Explain the End-to-End Donation Lifecycle and State Transitions.
**Answer:**  
The donation lifecycle transitions through five formal states:
$$\text{REQUESTED} \longrightarrow \text{ACCEPTED} \longrightarrow \text{PICKED\_UP} \longrightarrow \text{DELIVERED}$$
*(with alternative exit states `REJECTED` by NGO or `CANCELLED` by Donor).*
1. **REQUESTED:** Donor fills item details, attaches photos, and submits. System geocodes address via OpenStreetMap Nominatim and generates Block #1 (Genesis Block).
2. **ACCEPTED:** Target verified NGO reviews and accepts the donation. System creates a `Delivery` record, generates a 6-digit secret OTP for the NGO, and appends Block #2.
3. **PICKED_UP:** A volunteer driver discovers the task, claims it, arrives at donor's location, confirms pickup, and begins transit with live GPS telemetry. Block #3 is appended.
4. **DELIVERED:** Upon arrival at NGO, the volunteer inputs the NGO's secret OTP and snaps a proof photo. Once validated, status transitions to `DELIVERED` and Block #4 is sealed in the blockchain.

---

## SECTION 2: SECURITY, AUTHENTICATION & ACCESS CONTROL

### Q4. How does DonateConnect implement authentication and session persistence?
**Answer:**  
We employ **Stateless JSON Web Tokens (JWT)**:
- Upon login (`POST /api/auth/login`), credentials are verified against BCrypt-hashed passwords. A signed JWT containing user UUID, email, and granted role authority is returned.
- Clients store the token locally (`dc-token` & `dc-user` in `localStorage`), enabling seamless session persistence across reloads and device restarts.
- For every incoming request, our custom `JwtAuthFilter` intercepts the HTTP header, validates the HMAC-SHA256 signature using a 256-bit secret key, and populates Spring's `SecurityContextHolder`. No database session lookup is needed, making the system highly scalable.

---

### Q5. What is Role-Based Access Control (RBAC), and how is it enforced?
**Answer:**  
DonateConnect defines five distinct roles: `DONOR`, `NGO`, `VOLUNTEER`, `CORPORATE`, and `ADMIN`.  
RBAC is enforced at two levels:
1. **Method-Level Security:** Annotations such as `@PreAuthorize("hasRole('VOLUNTEER')")` or `@PreAuthorize("hasAnyRole('NGO', 'ADMIN')")` guard controller endpoints.
2. **Database-Level Ownership Isolation:** In endpoints such as `GET /api/donations/mine/{id}`, we query `donationRepository.findByIdAndDonorId(id, donorId)`. Even if an authenticated donor tries to access another donor’s UUID, the database query returns `null`, preventing Insecure Direct Object Reference (IDOR) attacks.

---

## SECTION 3: GEOLOCATION, MAPS & ROUTING

### Q6. How does the geocoding mechanism work? Why OpenStreetMap Nominatim instead of Google Maps API?
**Answer:**  
When an address is submitted, `GeocodingServiceImpl` sends an HTTP GET request to OpenStreetMap's Nominatim search service:
`https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1`
Nominatim resolves the address into decimal latitude and longitude coordinates.
- **Why OSM?** OpenStreetMap Nominatim is completely open-source, free, and does not require costly API billing credits or commercial vendor lock-in like Google Maps.
- To prevent rate-limiting, resolved coordinates are permanently cached in the `NGOProfile` / `Donation` PostgreSQL record so an address is geocoded only once.

---

### Q7. Explain the Haversine Formula used for donor-to-NGO proximity matching.
**Answer:**  
The **Haversine formula** calculates the great-circle distance between two points on a sphere given their latitudes and longitudes:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right), \quad d = R \cdot c$$
where $R = 6371 \text{ km}$ (Earth radius).  
This formula allows DonateConnect to sort and recommend NGOs in order of increasing distance from the donor's home, ensuring volunteer drivers travel the minimum distance.

---

## SECTION 4: BLOCKCHAIN AUDIT LEDGER

### Q8. Why did you use a Blockchain Ledger in a charity donation app?
**Answer:**  
Charitable donations frequently face donor skepticism and lack of transparency. Traditional centralized databases allow anyone with administrative access to alter or delete records retroactively.  
Our blockchain ledger creates an **immutable cryptographic chain of custody**:
- Every critical event (`CREATED`, `ACCEPTED`, `PICKED_UP`, `DELIVERED`) creates a block containing: `BlockIndex`, `PreviousHash`, `Timestamp`, `DonationId`, `Action`, and `Hash`.
- If an admin or attacker alters an older record, its hash changes, breaking the link with all subsequent blocks (`previousHash != hash`). This tamper-evidence restores complete trust for donors and auditors.

---

### Q9. How does your internal blockchain differ from public blockchains like Ethereum or Bitcoin?
**Answer:**  
1. **Zero Transaction Fees (Gasless):** Public blockchains require gas fees (cryptocurrency) for every write transaction, which is financially unviable for non-profit micro-donations. Our ledger is hosted internally.
2. **Instant Latency:** Mining or consensus in Bitcoin/Ethereum takes minutes; our SHA-256 block creation takes $< 2$ milliseconds.
3. **Eco-Friendly:** Uses lightweight cryptographic hashing without energy-wasting Proof-of-Work (PoW).
*(Note: It can be periodically anchored/hashed onto a public blockchain like Polygon or Ethereum for external third-party notarization).*

---

## SECTION 5: VOLUNTEER LOGISTICS & PROOF OF DELIVERY (PoD)

### Q10. What is Dual-Factor Proof of Delivery (PoD)? Why is it necessary?
**Answer:**  
Simple delivery apps rely on couriers clicking a "Delivered" checkbox, which leads to delivery disputes and fake completions. DonateConnect enforces **Dual-Factor PoD**:
1. **Secret 6-Digit OTP:** When a delivery is dispatched, the system generates a random 6-digit OTP visible **only** to the receiving NGO inside their dashboard. The volunteer cannot guess it; the NGO hands it over only after inspecting physical goods.
2. **Delivery Proof Photograph:** The volunteer takes a live doorstep photo of the handed-over goods using the mobile app camera, which is uploaded and stored with a timestamp.
Only when both the OTP matches and the image is received does the backend mark the status as `DELIVERED`.

---

## SECTION 6: INNOVATIVE FEATURES (NEXT-GEN)

### Q11. What is the Inter-NGO Circular Resource Trade Marketplace?
**Answer:**  
Often, one NGO receives an excess of clothing but has an acute shortage of baby food, while another shelter has surplus food but lacks blankets. Our Circular Marketplace allows verified NGOs to post surplus offers and request trades. This peer-to-peer resource exchange prevents waste and balances community supplies.

### Q12. What are 24/7 Smart Lockers?
**Answer:**  
Smart Lockers are designated public aggregation drop-off points. Donors who are unavailable during daytime volunteer pickup hours can deposit non-perishable goods (books, clothes) into secure lockers at any hour, where bulk logistics vans retrieve them later.

### Q13. What is the Emergency SOS Disaster Relief Mode?
**Answer:**  
In the event of natural disasters (e.g., monsoon floods in Assam or Wayanad), administrators activate `app.sos.active=true`. This dynamically renders a high-visibility red banner across all web and mobile screens, prioritizing critical relief supplies (tarpaulins, drinking water, dry rations).

---

## SECTION 7: TESTING & EVALUATION

### Q14. What testing frameworks did you use across the project?
**Answer:**  
We implemented a 4-tier testing pyramid:
1. **JUnit 5 & Mockito:** Backend unit tests for business services, Haversine formula, and SHA-256 block hashing.
2. **Spring Boot MockMvc:** Integration testing with an isolated in-memory H2 database to verify security filters, JWT extraction, and HTTP status codes.
3. **Vitest & React Testing Library:** Unit and component tests for React forms, state changes, and mobile responsive cards.
4. **Playwright:** End-to-end browser automation testing verifying complete donor $\rightarrow$ NGO $\rightarrow$ volunteer courier flows.

---

### Q15. What are the key limitations and future enhancements of your project?
**Answer:**  
- **Current Limitations:** Volunteers manually transmit simulated GPS coordinates if background mobile permissions are restricted; offline sync requires network reconnect.
- **Future Enhancements:**
  1. Integrating physical IoT microcontrollers (ESP32 / Solenoid locks) with QR scanners for automated Smart Locker door opening.
  2. Machine learning (LSTM/XGBoost) for predictive demand forecasting of seasonal donation surges.
  3. Multilingual voice assistant in regional Indian languages (Kannada, Hindi, Tamil) for easier grassroots accessibility.
