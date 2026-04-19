# Project: Pintor Plus

## Overview
PWA para pintores profissionais gerenciarem orçamentos, clientes e agenda. Currently migrating from Google Drive to Firebase + Dexie for better offline-first experience.

## Application Type
- Progressive Web App (PWA)
- Offline-first architecture
- Cross-platform (Android, iOS, Desktop)

## Primary Users
- Small painting businesses (1-10 employees)
- Professional painters who need mobile access to budgets on job sites

## Core Features
- Budget management with measurements and calculations
- Client database with contact info
- Supplier/vendor management
- Scheduling and reminders
- PDF receipt generation
- Cloud sync (migrating to Firebase)

## Technology Stack
- Vanilla JavaScript (client-side)
- Dexie.js for IndexedDB
- Firebase (Auth, Firestore, Storage)
- pdfmake for PDF generation
- Service Workers for offline functionality

## Current State
- Existing codebase in app_script.js (~4300 lines)
- Google Drive sync currently in production
- Legacy data in localStorage with _Vault encryption

## Goals
1. Migrate from Google Drive to Firebase
2. Implement proper offline-first with Dexie
3. Improve photo management with compression + cleanup
4. Replace html2pdf with pdfmake
5. Clean up legacy code