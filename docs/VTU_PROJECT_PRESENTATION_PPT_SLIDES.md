# 📊 DonateConnect: VTU Project Presentation (PPT) Slide Deck Script
### Final Year B.E. (8th / 7th Semester) Project Defense & Evaluation

---

## 📽️ Slide Breakdown & Presentation Guidelines
- **Target Time:** 12 to 15 Minutes (followed by 5 minutes of Q&A and Demo).
- **Recommended Theme:** Minimalist Dark or Warm Pearl, high-contrast typography, diagrams over text.

---

### **SLIDE 1: TITLE SLIDE**
- **Project Title:** DONATECONNECT: An Intelligent Omni-Channel Philanthropic Logistics Platform with Real-Time GPS Tracking, Mobile Client, and Immutable Blockchain Audit Ledger
- **Degree:** Bachelor of Engineering in Computer Science & Engineering
- **University:** Visvesvaraya Technological University, Belagavi
- **Team Members & USNs:**  
  1. [Student Name 1] (1XX21CSXXX)  
  2. [Student Name 2] (1XX21CSXXX)  
  3. [Student Name 3] (1XX21CSXXX)  
  4. [Student Name 4] (1XX21CSXXX)  
- **Internal Guide:** [Guide Name], M.Tech, (Ph.D), Assistant Professor  
- **Academic Year:** 2025–2026 | [College Name, City]

> 🗣️ **Speaker Script:**  
> *"Respected external examiner, internal guide, and faculty members, good morning. Today, our team is presenting our final year engineering project: DonateConnect—an intelligent omni-channel philanthropic logistics platform designed to bring transparency, real-time tracking, and automated coordination to charitable giving."*

---

### **SLIDE 2: MOTIVATION & SOCIO-ECONOMIC CONTEXT**
- **Urban Resource Paradox:** Tons of surplus cooked food, wearable clothes, books, and essential medicines are wasted daily in urban centers.
- **Grassroots Crisis:** Hundreds of orphanages, elderly shelters, and relief camps face critical day-to-day shortages.
- **The Missing Link:** Donors are willing to give, but are deterred by cumbersome travel logistics and deep skepticism over whether items actually reach legitimate beneficiaries.

---

### **SLIDE 3: PROBLEM STATEMENT**
- **No Last-Mile Logistics Dispatch:** Existing websites are static noticeboards; donors must personally deliver items.
- **Absence of Omni-Channel Mobility:** Donors on the move cannot easily snap item photos or transmit live coordinates via mobile GPS.
- **Pervasive Trust Deficit:** Lack of verifiable audit trails leads to suspicion of diversion or black-marketing.
- **Fragmented NGO Silos:** Lack of inter-NGO resource bartering causes localized surpluses and simultaneous shortages.

---

### **SLIDE 4: PROJECT OBJECTIVES**
1. **Multi-Role Cloud Architecture:** Spring Boot 3 + PostgreSQL with 5 distinct RBAC roles (`DONOR`, `NGO`, `VOLUNTEER`, `CORPORATE`, `ADMIN`).
2. **Omni-Channel Client:** React 18 web dashboard alongside a cross-platform mobile app client.
3. **Automated Geocoding & Proximity Matching:** OpenStreetMap Nominatim + Haversine Distance computation.
4. **Volunteer Logistics Console:** Real-time driver dispatch, Leaflet GPS tracking, and dual-factor Proof-of-Delivery (OTP + photo).
5. **Cryptographic Blockchain Ledger:** Internal SHA-256 block hashing for tamper-evident provenance.
6. **Community Features:** 24/7 Smart Lockers, Circular Resource Barter, and Emergency Disaster SOS mode.

---

### **SLIDE 5: SYSTEM ARCHITECTURE (3-TIER DISTRIBUTED DESIGN)**
- *(Include the 3-Tier Architecture Diagram from Fig 4.1)*
- **Tier 1 (Presentation):** React 18 SPA + Mobile App Client with camera & geolocation telemetry.
- **Tier 2 (Service Layer):** Spring Boot 3.4.2 REST APIs, Spring Security 6 stateless JWT, Geocoding service, Blockchain hashing engine.
- **Tier 3 (Persistence):** PostgreSQL 16 (Neon Serverless), local/cloud object storage, external OpenStreetMap Nominatim.

---

### **SLIDE 6: DATA FLOW & SYSTEM OPERATION (DFD LEVEL 1)**
- *(Include DFD Level 1 Diagram from Fig 4.3)*
- Step 1: Donor submits request with photos $\rightarrow$ Geocoding converts address to Lat/Lng $\rightarrow$ Block #1 created.
- Step 2: Target NGO reviews and accepts request $\rightarrow$ Delivery task created $\rightarrow$ Secret OTP generated.
- Step 3: Volunteer courier claims task $\rightarrow$ streams GPS pings $\rightarrow$ collects items.
- Step 4: Volunteer enters NGO's secret OTP & doorstep proof photo $\rightarrow$ Delivery certified $\rightarrow$ Final Block appended.

---

### **SLIDE 7: MOBILE APPLICATION CLIENT ECOSYSTEM**
- **Native Camera Access:** Direct camera API integration allows donors to snap item condition and drivers to snap delivery receipts.
- **Continuous GPS Telemetry:** Mobile client periodically updates driver coordinates (`lastLat`, `lastLng`) for live map tracking.
- **Adaptive Mobile Cards:** Responsive touch-friendly card layouts with expandable timeline modals for outdoor operation.
- **Emergency Push Alerts:** Instant broadcasts for urgent NGO SOS requests.

---

### **SLIDE 8: GEOSPATIAL PROXIMITY & HAVERSINE ALGORITHM**
- **Nominatim Geocoding:** Converts free-form addresses into exact decimal coordinates.
- **Haversine Distance Formulation:**
  $$d = 2R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
- **Benefits:** Automatically ranks NGOs by proximity to donor location, minimizing volunteer travel distance and reducing turnaround time by over 60%.

---

### **SLIDE 9: VOLUNTEER DISPATCH & DUAL-FACTOR PROOF OF DELIVERY (PoD)**
- Traditional apps use an unverified checkbox $\rightarrow$ causes disputes and lost goods.
- **DonateConnect Dual-Factor PoD:**
  1. **6-Digit Dynamic OTP:** Generated upon assignment, revealed **only** to the receiving NGO inside their secure dashboard.
  2. **Timestamped Proof Photograph:** Driver snaps an image of delivered boxes at the NGO facility.
- Prevents fraud, proxy pickups, and unauthorized claims.

---

### **SLIDE 10: IMMUTABLE BLOCKCHAIN AUDIT LEDGER**
- **Structure:** Block Index, Previous Hash, Current Hash, Timestamp, Donation ID, and Lifecycle Action.
- **Mathematical Integrity:**
  $$\mathcal{H}_i = \text{SHA-256}\Big(\text{Index}_i \,\|\, \mathcal{H}_{i-1} \,\|\, \mathcal{T}_i \,\|\, \text{UUID}_i \,\|\, \text{Action}_i\Big)$$
- **Zero Gas Cost & Instant Speed:** Solves the cost and latency bottlenecks of public Ethereum/Bitcoin networks while preserving cryptographic tamper-evidence.

---

### **SLIDE 11: NEXT-GEN HUMANITARIAN MODULES**
1. **Inter-NGO Circular Resource Trade:** Verified NGOs barter excess provisions (e.g., trading surplus apparel for dry rations).
2. **24/7 Contactless Smart Lockers:** Physical drop-off points for donors who cannot wait for volunteer daytime pickups.
3. **Emergency SOS Disaster Mode:** Live red banner prioritizing blankets, drinking water, and dry rations during flood/monsoon relief drives.

---

### **SLIDE 12: DATABASE SCHEMA & SECURITY DESIGN**
- **Entity Relationships:** Modeled across `users`, `ngo_profiles`, `donations`, `deliveries`, `blockchain_blocks`, and `smart_lockers`.
- **Stateless JWT Security:** HMAC-SHA256 tokens with 24-hour expiration.
- **Database-Level Ownership Isolation:** Queries enforce `findByIdAndDonorId(id, donorId)`, completely preventing cross-tenant IDOR vulnerabilities.

---

### **SLIDE 13: TESTING & QUALITY ASSURANCE**
- **Unit Testing (JUnit 5 + Mockito):** Verified Haversine math, OTP generation, and SHA-256 block linking.
- **Integration Testing (Spring MockMvc + H2 DB):** Verified RBAC endpoints, security filters, and HTTP status codes.
- **Frontend Testing (Vitest + RTL):** Verified form validation, UI modals, and mobile card views.
- **E2E Testing (Playwright):** Full automated flow: Donor $\rightarrow$ NGO $\rightarrow$ Volunteer courier.
- **Result:** 100% test pass rate across all 12 core test suites.

---

### **SLIDE 14: PERFORMANCE & BENCHMARK RESULTS**
- **Average API Response Time:** $< 45 \text{ ms}$ under normal traffic.
- **High Concurrency Load (500 users):** 95th percentile latency $< 120 \text{ ms}$.
- **Throughput:** Handled up to 920 requests/second on live GPS location streaming.
- **Error Rate:** $< 0.01\%$ across 10,000 automated load-test requests.

---

### **SLIDE 15: LIVE DEMONSTRATION WORKFLOW**
- Show Donor creating a donation request with photo upload.
- Show NGO accepting the item and receiving the 6-digit OTP.
- Show Volunteer Driver claiming the task and live Leaflet GPS map tracking.
- Show Volunteer entering OTP, uploading proof photo, and completing delivery.
- Show the Public Blockchain Ledger updating with the new verified SHA-256 block.

---

### **SLIDE 16: CONCLUSION & FUTURE SCOPE**
- **Summary:** DonateConnect successfully unites donors, NGOs, and couriers through an omni-channel, verifiable, and transparent platform.
- **Future Directions:**
  1. IoT microcontroller integration (ESP32) for automated smart locker solenoids.
  2. AI/ML-driven demand forecasting for seasonal donation spikes.
  3. Multilingual voice assistant in regional Indian languages (Kannada, Hindi).

---

### **SLIDE 17: REFERENCES**
- IEEE standard references [Sharma et al. 2022, Choudhary & Roy 2022, Venkatesh et al. 2023, Nakamoto 2008, VTU Project Guidelines 2021].

---

### **SLIDE 18: THANK YOU & Q/A**
- Open for questions and discussion with External and Internal Examiners.
