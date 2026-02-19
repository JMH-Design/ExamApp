# Exam App

AI-powered practice exams for your courses. v0.1 includes the onboarding flow: school, program, semester, and textbook selection with AI-powered textbook discovery.

## Setup

1. Copy the environment example and add your API keys:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your **Perplexity API key** (required) at [perplexity.ai/api-platform](https://perplexity.ai/api-platform)

3. Optionally add a **Google Books API key** for textbook cover images at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the onboarding flow.

## Onboarding Flow

1. **School** – Search and select Ohio State University (MVP)
2. **Program** – Search and select your graduate nursing program
3. **Semester** – Choose Fall, Spring, or Summer (defaults to current)
4. **Textbook** – AI discovers top textbooks in the background while you select semester. Select your textbook to load course topics.

Data is stored in `localStorage` for v0.1.
