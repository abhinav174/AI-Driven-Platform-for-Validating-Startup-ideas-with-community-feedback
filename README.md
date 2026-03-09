# AI-Driven Platform for Validating Startup Ideas with Community Feedback

A full-stack founder platform where users can register, submit startup ideas, get AI-style validation insights, and connect with other founders through profiles, connection requests, notifications, and private messaging.

## Features

- User registration and login
- Protected founder dashboard
- Startup idea submission with title and description
- AI-style startup analysis with:
  - startup strength score
  - risks
  - competitors
  - market snapshot
  - budget estimate
  - initial problems
  - founder advice
- Community comments on ideas
- Founder profiles with interests, skills, and links
- Founder networking with connection requests
- Notifications for requests and accepted connections
- Private messaging between accepted connections
- Local dataset-driven analysis using `startup_funding.csv`

## Tech Stack

### Frontend
- React
- React Router DOM
- Vite
- CSS

### Backend
- Node.js
- Express.js
- CORS
- bcryptjs
- jsonwebtoken

### Data Layer
- Local JSON storage via `data/platform-data.json`
- CSV dataset: `data/startup_funding.csv`

### AI / Analysis Layer
- Custom Node.js analysis engine in `backend/utils/ideaAnalyzer.js`
- Startup funding dataset matching for competitors and market signals
- Heuristic scoring for risk, validation strength, and budget estimation

## Project Structure

```text
Codex/
|- frontend/
|- backend/
|- data/
|- ai-engine/
```

## Installation

Make sure Node.js is installed first.

### Backend
```powershell
cd backend
npm install
npm start
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Then open:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Single Setup Commands

Backend:
```powershell
cd backend; npm install
```

Frontend:
```powershell
cd frontend; npm install
```

## How It Works

1. A founder registers or logs in.
2. The founder submits a startup idea.
3. The backend analyzes the idea using keyword signals and startup funding data.
4. The platform returns validation insights including score, risk, competitors, and advice.
5. Other founders can comment, view profiles, send connection requests, and message each other.

## Local Data

This project currently stores app data locally in:

```text
data/platform-data.json
```

That means users, ideas, comments, connections, messages, and notifications are stored on the local machine unless you later move to a real database.

## Future Improvements

- Deploy frontend and backend online
- Replace local JSON storage with MongoDB, PostgreSQL, or Supabase
- Add real LLM integration using OpenAI or Gemini
- Add real-time messaging
- Add search and filtering for founders
- Add profile images and richer founder discovery

## Repository

GitHub repository:

[https://github.com/abhinav174/AI-Driven-Platform-for-Validating-Startup-ideas-with-community-feedback](https://github.com/abhinav174/AI-Driven-Platform-for-Validating-Startup-ideas-with-community-feedback)
