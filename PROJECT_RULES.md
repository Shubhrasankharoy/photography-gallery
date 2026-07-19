# Photography Gallery SaaS - Project Rules

## Project Vision

Build a production-ready Photography Gallery SaaS similar to Pixieset.

The platform is Studio-centric.

Users create Studios.

Studios contain Members.

Studios create Events.

Members upload Photos.

Guests browse and download photos.

Future AI will search photos by face.

---

# Tech Stack

Framework
- Next.js 16 (App Router)

Language
- JavaScript ONLY
- Never use TypeScript

Styling
- Tailwind CSS

Authentication
- Firebase Authentication

Database
- Firebase Firestore

Storage
- Cloudinary (temporary)
- Google Drive (production)

Hosting
- Vercel Free

Backend
- Next.js Route Handlers
- Never use Express

---

# Architecture

User

↓

Studio

↓

Studio Members

↓

Events

↓

Photos

↓

Downloads

Never build photographer-owned events.

Every Event belongs to exactly one Studio.

Every Photo belongs to:

- Studio
- Event
- UploadedBy (User)

---

# Studio Roles

Owner

- Full access
- Transfer ownership
- Delete studio

Admin

- Manage events
- Invite members
- Remove members

Photographer

- Upload photos
- View assigned events

Viewer

- Read only

---

# Google Drive Rules

Every member connects their own Google Drive.

Never store Google Drive credentials inside Studio documents.

Uploads always go to the uploader's Google Drive.

Firestore stores only metadata.

---

# Coding Rules

1. JavaScript only.
2. Never use TypeScript.
3. Build ONE phase only.
4. Never modify completed features unless required.
5. Keep components reusable.
6. Mobile-first responsive design.
7. Production-ready code.
8. Modular folder structure.
9. Use loading states.
10. Use proper error handling.
11. Validate every form.
12. Explain every new file.
13. Don't install unnecessary packages.
14. Never create placeholder code.
15. Never break existing functionality.
16. Use Firestore efficiently.
17. Optimize reads and writes.
18. Keep APIs scalable.
19. Keep code clean.
20. Keep naming consistent.

---

# Folder Structure

app/

components/

lib/

contexts/

hooks/

firebase/

services/

utils/

types/

public/

---

# Firestore Collections

users

studios

studioMembers

studioInvitations

driveConnections

events

photos

downloads

notifications

activities

---

# Before Every Phase

Read:

PROJECT_RULES.md

TODO.md

Only implement the requested phase.

Stop after completing it.

Provide:

- Folder structure
- Files created
- Files modified
- Manual testing checklist

Never continue automatically.