# StepWise AI

A mobile-first homework assistant app built in React + Vite.

## What it includes

- Home dashboard for priority planning
- Homework helper with guided AI-style responses
- Challenges screen with streaks and rewards
- Progress analytics across subjects
- Profile screen with goals and achievements
- Embedded reference gallery sourced from the repo images

## Run locally

```bash
npm install
npm run dev
```

## OpenRouter environment

Create `.env.local` in the project root with:

```bash
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
VITE_OPENROUTER_APP_NAME=StepWise
VITE_OPENROUTER_APP_URL=http://localhost:5173
```

## Build

```bash
npm run build
```
