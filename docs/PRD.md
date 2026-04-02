# Christos Cakes — PRD
ONE-LINE PURPOSE: A bespoke luxury cake ordering and management platform.
VERSION: 1.0.0
DATE: 2026-03-29
AUTHOR: AI Studio Build
STATUS: Confirmed

1. PROBLEM STATEMENT
Bespoke cake ordering is often a fragmented process involving multiple emails, manual price calculations, and inconsistent order tracking. Christos Cakes needs a unified platform to manage luxury cake orders, from initial customer inquiry to final delivery and payment.

2. SOLUTION OVERVIEW
A high-end, visual-first web application that allows customers to browse a gallery of designs, submit detailed bespoke order requests, and track their order status. For the owner, it provides a centralized dashboard to manage orders, update the gallery, and automate client communications.

3. USERS & ROLES
Customer:
  WHO: Individuals looking for bespoke luxury cakes for special events.
  CAN DO: Browse gallery, submit order requests (cake or pastries), view order status and invoices.
  CAN SEE: Public gallery, their own order details.
  CANNOT: Access admin portal or other customers' data.
  DEVICE: Both (mobile-first for browsing).

Platform Admin (App Owner):
  WHO: The builder/client who owns the platform (Christos Cakes).
  CAN DO: All content management, settings, user management, data operations.
  CAN SEE: All data, all metrics, all logs.
  CANNOT: Nothing — full access.
  DEVICE: Desktop (admin panel is desktop-first).
  ACCESS: Via protected admin dashboard — never touches code.

4. ARCHITECTURE
APP TYPE: Public storefront + authenticated admin portal.
AUTH MODEL: Password-protected admin access (simple key-based for now).

PAGE/VIEW STRUCTURE:
  Storefront (Home) — Public — No
  Order Form — Public — No
  Order View (Invoice) — Public (ID-based) — No
  Admin Portal — Admin — Yes (Password)

DATA ACCESS PATTERN:
  PUBLIC (routed via automation):
    - Submit order request
  AUTHENTICATED USER — OWN DATA (direct DB + RLS):
    - View specific order by ID
  ADMIN OPERATIONS (server function + admin JWT):
    - Manage all orders, gallery, and settings

PRIMARY DEVICE: Mobile-first for customers, Desktop-first for admin.
DEPLOYMENT TARGET: Vercel / Cloud Run.

5. TECH STACK
AI MODEL: Gemini 3 Flash — used for order processing and content generation.
DATABASE: Supabase (PostgreSQL) — reliable relational data storage.
AUTOMATION: n8n — handles order notifications and client emails.
AUTH: Simple password protection for admin.
EMAIL: Twilio/SendGrid via n8n.
SMS/WHATSAPP: Twilio via n8n.
DEPLOYMENT: Vercel.
FILE/MEDIA STORAGE: Base64 in DB (for now) or Supabase Storage.

6. FEATURES — MVP SCOPE
Gallery Studio (P0):
  - Admin can upload and manage cake photos.
  - Customers can browse a luxury-styled gallery.

Bespoke Order Engine (P0):
  - Detailed multi-step order form for cakes and pastries.
  - Support for image inspiration uploads.
  - Automatic delivery fee calculation based on postcode.

Order Management (P0):
  - Admin dashboard to track order status (Pending, Baking, Ready, Completed).
  - Price management (base price + delivery fee).
  - One-click "Send to Client" to trigger automated emails/WhatsApp.

Owner Dashboard (P0):
  - View key metrics (Revenue, Active Orders).
  - Manage site settings (Logo, WhatsApp number).
  - Wipe demo data.

7. DATA MODEL
orders:
  id: TEXT PRIMARY KEY
  customerName: TEXT NOT NULL
  email: TEXT NOT NULL
  phone: TEXT NOT NULL
  fulfillmentType: TEXT NOT NULL
  category: TEXT NOT NULL DEFAULT 'Cake'
  pastries: JSONB DEFAULT '[]'::jsonb
  postcode: TEXT
  address: TEXT
  deliveryFee: NUMERIC NOT NULL DEFAULT 0
  deliveryDate: TEXT NOT NULL
  deliveryTimeSlot: TEXT NOT NULL
  flavor: TEXT NOT NULL
  size: TEXT NOT NULL
  messageOnCake: TEXT
  inspirationImage: TEXT
  inspirationLink: TEXT
  totalPrice: NUMERIC NOT NULL DEFAULT 0
  status: TEXT NOT NULL DEFAULT 'Pending'
  distance: NUMERIC
  createdAt: TEXT NOT NULL
  dummy_data: BOOLEAN DEFAULT false

gallery:
  id: TEXT PRIMARY KEY
  url: TEXT NOT NULL
  displayMode: TEXT NOT NULL
  createdAt: TEXT NOT NULL
  dummy_data: BOOLEAN DEFAULT false

settings:
  id: INTEGER PRIMARY KEY DEFAULT 1
  logoUrl: TEXT
  adminWhatsAppNumber: TEXT
  dummy_data: BOOLEAN DEFAULT false

pastries:
  id: TEXT PRIMARY KEY
  name: TEXT NOT NULL
  description: TEXT NOT NULL
  price: NUMERIC NOT NULL DEFAULT 0
  order: INTEGER NOT NULL DEFAULT 0
  dummy_data: BOOLEAN DEFAULT false

8. AUTOMATIONS
Order Notification:
  TRIGGER: New order submission.
  STEPS: 1. Receive webhook. 2. Notify admin via WhatsApp.
  SERVICES: n8n, Twilio.
  TOOL: n8n.
  ON FAILURE: Log error.

Client Invoice:
  TRIGGER: Admin clicks "Send to Client".
  STEPS: 1. Receive webhook with order details. 2. Send WhatsApp/Email to client with link to Order View.
  SERVICES: n8n, Twilio.
  TOOL: n8n.
  ON FAILURE: Notify admin.

9. DESIGN DIRECTION
VISUAL TONE: Luxury, Minimal, Elegant, Soft.
COLOR DIRECTION:
  Primary: #be185d (Pink/Rose)
  Background: #fffafa (Soft White)
  Accent: #1c1917 (Luxury Ink)
TYPOGRAPHY:
  Heading: Playfair Display (Serif)
  Body: Inter (Sans-serif)
KEY UI PATTERNS: Glassmorphism, Large Serif Typography, High-quality imagery.

10. CREDENTIALS & ENVIRONMENT VARIABLES
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_N8N_WEBHOOK_URL

11. SECURITY DESIGN
RLS STRATEGY: Default deny, explicit allow for public inserts and ID-based reads.
AUTH TOKEN HANDLING: Simple password for admin portal.
INPUT VALIDATION: Client-side validation on all forms.

12. PERFORMANCE REQUIREMENTS
TARGET LOAD TIME: < 2s.
CONCURRENT USERS: Low (Boutique scale).

13. COMPLIANCE & ACCESSIBILITY
  [x] GDPR
SPECIFIC REQUIREMENTS: Data privacy for customer orders.

14. ASSUMPTIONS
- Admin access is secured via a simple shared password for MVP.
- Inspiration images are stored as Base64 strings in the database for simplicity.

15. OPEN QUESTIONS
- None.

16. OUT OF SCOPE (MVP)
- Full user accounts for customers.
- Real-time payment processing (Bank transfer only for MVP).
