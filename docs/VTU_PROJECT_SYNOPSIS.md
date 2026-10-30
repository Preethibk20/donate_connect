# VISVESVARAYA TECHNOLOGICAL UNIVERSITY
### Belagavi, Karnataka – 590018

---

## **PROJECT SYNOPSIS**
### **DONATECONNECT: AN INTELLIGENT OMNI-CHANNEL PHILANTHROPIC LOGISTICS PLATFORM WITH REAL-TIME GPS TRACKING, MOBILE CLIENT, AND IMMUTABLE BLOCKCHAIN AUDIT LEDGER**

---

### **Submitted By:**
1. **[Student Name 1]** (USN: 1XX21CSXXX)
2. **[Student Name 2]** (USN: 1XX21CSXXX)
3. **[Student Name 3]** (USN: 1XX21CSXXX)
4. **[Student Name 4]** (USN: 1XX21CSXXX)

### **Under the Guidance of:**
**[Guide Name]**, M.Tech, (Ph.D)  
Department of Computer Science and Engineering  
**[College Name, City]**

---

## 1. Introduction
In urban centers across India and the developing world, significant quantities of surplus cooked food, unexpired packaged provisions, wearable garments, school textbooks, and essential medical supplies are discarded daily. Concurrently, thousands of registered orphanages, old-age shelters, and disaster-relief shelters face severe operational shortages. Traditional charity avenues fail because donors lack convenient digital avenues, real-time logistics tracking, and verified trust mechanisms. **DonateConnect** is an enterprise-grade omni-channel philanthropic logistics platform bridging Donors, Verified NGOs, Volunteer Couriers, Corporates, and Administrators.

## 2. Problem Statement
Existing charity portals function primarily as static bulletin boards with critical drawbacks:
1. **No Active Volunteer Logistics Dispatch:** Donors must personally transport items, leading to high abandonment rates.
2. **Lack of Omni-Channel Mobile Accessibility:** Donors and field volunteers cannot utilize native smartphone camera photo uploads and GPS tracking on the move.
3. **Pervasive Trust Deficit:** Absence of immutable audit trails creates suspicion regarding whether donations actually reach intended beneficiaries.
4. **Resource Imbalances:** NGOs cannot easily barter or trade surplus resources with neighboring organizations.

## 3. Objectives
1. Build a multi-role cloud backend with **Spring Boot 3 (Java 21)**, **PostgreSQL**, and stateless **JWT** Role-Based Access Control (RBAC).
2. Develop an omni-channel interface: a responsive **React 18** web portal paired with a **Mobile Application Client** (camera uploads, touch-friendly UI, and native GPS).
3. Implement automated geospatial matching using **OpenStreetMap Nominatim** and the **Haversine Distance Algorithm**.
4. Deploy a volunteer logistics console featuring live GPS tracking and dual-factor **Proof-of-Delivery (PoD)** via dynamic OTP and doorstep photos.
5. Engineer an internal **SHA-256 cryptographic blockchain audit ledger** providing tamper-evident transparency.
6. Provide emergency humanitarian modules: 24/7 Smart Locker drop-offs, Inter-NGO Circular Trade, and an Emergency SOS Disaster Broadcast banner.

## 4. Methodology & Architecture
DonateConnect employs a 3-Tier Distributed Architecture:
- **Presentation Layer:** Mobile Client (Donor/Driver camera & GPS) and React 18 Web Dashboard (Vite, TypeScript, Tailwind CSS, Leaflet Maps).
- **Service Layer:** Spring Boot 3.4.2 REST APIs, Spring Security 6 stateless filters, Haversine proximity calculator, and SHA-256 blockchain hashing engine.
- **Data Layer:** PostgreSQL (Neon serverless cloud), local/cloud object storage, and external OpenStreetMap Nominatim APIs.

## 5. Hardware & Software Requirements
- **Hardware:** Modern PC / Server (4+ Cores, 8GB RAM, SSD), Android/iOS Smartphone with GPS and Camera.
- **Software:** Java 21 LTS, Node.js 18+, Spring Boot 3.4.2, PostgreSQL 16, React 18, Leaflet.js, Git, Maven.

## 6. Expected Outcomes
- Sub-120ms API response times across core endpoints.
- Verifiable delivery cycle with 0% unverified deliveries due to dual-factor OTP + photo validation.
- Complete cryptographic audit history accessible to donors.
- Greater than 60% reduction in logistical coordination latency between donors and nearby verified NGOs.

---
**Guide Signature:** ........................................ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **HOD Signature:** ........................................
