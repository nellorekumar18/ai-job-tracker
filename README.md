# AI Job Tracker 🚀

An AI-powered job application tracker built with React, TypeScript, Node.js, Express, and PostgreSQL. Manage job applications, analyze resumes, evaluate resume quality, and compare resume skills with job descriptions.

## ✨ Features

### 📊 Job Application Dashboard

- Create, view, update, and manage job applications.
- Search applications and filter them by status.
- View application statistics and status summaries.
- Retain application data across page refreshes.

### 📄 Resume Analysis

- Upload PDF resumes and extract their text.
- Generate AI-assisted resume feedback.
- Identify strengths, improvement areas, and potentially missing sections.
- Evaluate common resume elements using a rule-based quality checklist.

### 🎯 Job Description Matching

- Compare resume keywords with skills mentioned in a job description.
- Identify matched and missing skills.
- Calculate a keyword-overlap match score.
- Provide suggestions for improving the relevance of a resume.

### 🔐 Authentication and Error Handling

- Authenticate users before accessing protected features.
- Handle API errors and unavailable backend or AI services.
- Keep application configuration and secrets outside the public repository.

> **Important:** Resume quality scores and job-match scores are guidance tools, not official ATS scores. Job matching uses keyword-based rules and does not verify a candidate's proficiency. AI feedback can also contain mistakes, so review all suggestions before editing a resume.

## 🛠️ Technology Stack

| Layer | Technologies |

|---|---|
| Frontend | React, TypeScript, Vite, HTML, CSS |
| Backend | Node.js, Express.js, TypeScript |
| API | REST APIs |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Token-based authentication |
| Resume processing | PDF text extraction |
| Local AI | Ollama with Llama 3.2 |
| API testing | Postman |
| Version control | Git and GitHub |

## 🏗️ Architecture

```text
User
 |
 v
React + TypeScript + Vite
 |
 | HTTP requests
 v
Express + TypeScript REST API
 |
 +-- Authentication middleware
 |
 +-- Job application routes
 |
 +-- Resume upload and text extraction
 |
 +-- Resume quality checklist
 |
 +-- Job-description matching
 |
 +-- AI resume analysis
 |        |
 |        v
 |      Ollama
 |
 v
Prisma ORM
 |
 v
PostgreSQL
```

The frontend handles the user interface. The backend validates requests, protects routes, and implements application logic. Prisma provides database access, while PostgreSQL stores application records. Resume analysis uses the configured local AI service.

## 📁 Project Structure

```text
AI-Job-Tracker/
├── client/
│   ├── public/
│   └── src/
│       ├── App.tsx
│       ├── JobDashboard.tsx
│       ├── api.ts
│       ├── App.css
│       └── index.css
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── jobs.ts
│   │   │   ├── profile.ts
│   │   │   └── resume.ts
│   │   ├── prisma.ts
│   │   └── server.ts
│   └── prisma.config.ts
├── .gitignore
└── README.md
```

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git
- Ollama and the configured model for local AI analysis

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/nellorekumar18/ai-job-tracker.git
cd ai-job-tracker
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

Create `client/.env` if needed:

```env
VITE_API_URL=http://localhost:5000/api
```

Return to the project root when you need to work with the backend:

```bash
cd ..
```

### 3. Configure the backend

```bash
cd server
npm install
```

Create `server/.env` with the required database connection and authentication settings. Use the actual variable names expected by the server configuration.

Example template only:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=replace_with_a_strong_random_secret
```

Add any other variables required by your configured AI service. Never commit real credentials or secret values.

### 4. Configure PostgreSQL and Prisma

- Start PostgreSQL.
- Create or configure the project database.
- Set the database connection string in `server/.env`.
- Review `server/package.json` and `server/prisma.config.ts` for the project's configured Prisma commands.
- Apply the existing database migrations using the appropriate command for this project.

### 5. Start Ollama

Ensure Ollama is running and the configured model is available locally. For example, if you use Llama 3.2:

```bash
ollama list
```

If the model is not installed, obtain it using Ollama's official instructions. The backend must also be configured to call the local Ollama service.

### 6. Run the application

Open separate terminals for the backend and frontend.

**Backend terminal:**

```bash
cd server
npm run dev
```

**Frontend terminal:**

```bash
cd client
npm run dev
```

The development URLs are expected to be:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

Check each package's scripts and configuration if your local ports differ.

### 7. Verify the backend

Open this URL in your browser:

```text
http://localhost:5000/api/health
```

The health endpoint should return a successful JSON response when the backend is running.

## 🔌 API Endpoints

The following resume endpoints are implemented in the backend. Protected endpoints require valid authentication.

| Method | Endpoint | Purpose |

|---|---|---|
| GET | `/api/health` | Check backend availability |
| POST | `/api/resume/upload` | Upload a resume and extract text |
| POST | `/api/resume/analyze` | Request AI resume analysis |
| POST | `/api/resume/quality-score` | Calculate the rule-based quality score |
| POST | `/api/resume/job-match` | Compare resume keywords with a job description |

## Request examples

Resume analysis:

```json
{
  "resumeText": "MCA graduate with experience in Python, React, and SQL."
}
```

Job matching:

```json
{
  "resumeText": "MCA graduate with experience in Python and SQL.",
  "jobDescription": "Required skills: Python, SQL, and Docker."
}
```

These examples illustrate request formats. Successful responses depend on valid authentication, backend configuration, and the supplied data.

## 🧪 Testing

The project has been exercised through manual application workflows and API checks.

Important workflows to validate when changing the code:

- Registration, login, authentication, and logout
- Creating, updating, searching, and filtering job applications
- Application data persistence after refresh
- Resume upload and PDF text extraction
- AI resume analysis and error handling
- Resume quality checklist calculations
- Job-description matching, matched skills, and missing skills
- API behavior when the backend or local AI service is unavailable

For API testing, use Postman with your own local account and authentication token. Add automated tests as the project evolves.

## 🔒 Security and Privacy

- Never commit `.env` files, API keys, passwords, or authentication tokens.
- Keep uploaded resumes and generated files out of Git.
- Use placeholder values in `.env.example`.
- Avoid publishing real resumes or personal information.
- Review file upload validation, access controls, and retention policies before deploying.
- Never share a real authentication token in screenshots or documentation.

## 🗺️ Future Improvements

- Deploy the frontend and backend.
- Add automated API and UI tests.
- Improve skill normalization and job-description matching.
- Add more robust resume file validation and secure storage.
- Improve accessibility and mobile responsiveness.
- Expand documentation with application screenshots and deployment instructions.

## 👨‍💻 Author

### KUMAR NELLORE

GitHub: [@nellorekumar18](https://github.com/nellorekumar18)

Project repository: [AI Job Tracker](https://github.com/nellorekumar18/ai-job-tracker)

## 📄 License

No license has been specified. Until a license is added, do not assume that others have permission to reuse, modify, or distribute this project.
