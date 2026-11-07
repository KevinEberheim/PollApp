# PollApp

A survey app built with Angular, TypeScript and SCSS. Users can create surveys with several questions, vote on running surveys and watch the results update in real time. Supabase is used as the backend. The design is based on a Figma file.

Live: https://kevin-eberheim.developerakademie.net/angular-projects/PollApp/

## Features

- Home page with "Ending soon" cards (earliest deadline first) and a list of all surveys
- Tabs for active and past surveys
- Category filter per tab, including "All"
- Create page with required and optional fields, validation and up to 4 questions with up to 6 answers each
- Single or multiple choice, set per question
- Detail page with voting and live results next to the survey (desktop layout)
- Past surveys can be viewed but not voted on
- Home page updates automatically when the `surveys` table changes
- Responsive layout for mobile (375px)

## Tech Stack

- Angular 21 (standalone components, signals, reactive forms, routing, pipes)
- TypeScript
- SCSS (CSS animations, no Angular animations)
- Supabase (PostgreSQL, Realtime)

## Routes

| Path          | Page                           |
| ------------- | ------------------------------ |
| `/`           | Home                           |
| `/create`     | Create a new survey            |
| `/survey/:id` | Survey detail with live result |

## Getting Started

Requirements: Node.js, npm and the Angular CLI.

```bash
npm install
npm start
```

The app runs at `http://localhost:4200/`.

Production build (example with a sub path):

```bash
ng build
```

Upload the content of `dist/<project>/browser/` to the server.

## Supabase Setup

The Supabase client is provided as a service in `src/app/supabase.ts`. Replace the project URL and the publishable key with your own.

The publishable key is meant for the frontend, but it does not protect any data. Protection comes only from Row Level Security (RLS).

### Tables

`surveys`

| Column       | Type        | Notes                         |
| ------------ | ----------- | ----------------------------- |
| `id`         | int8        | identity, primary key         |
| `title`      | text        | not null                      |
| `description`| text        | nullable                      |
| `category`   | text        | not null                      |
| `end_date`   | timestamptz | nullable (no deadline)        |
| `questions`  | jsonb       | not null                      |
| `created_at` | timestamptz | not null, default `now()`     |

`votes`

| Column           | Type        | Notes                                      |
| ---------------- | ----------- | ------------------------------------------ |
| `id`             | int8        | identity, primary key                      |
| `survey_id`      | int8        | foreign key to `surveys.id`, on delete cascade |
| `question_index` | int4        | not null                                   |
| `option_index`   | int4        | not null                                   |
| `created_at`     | timestamptz | not null, default `now()`                  |

Format of `questions`:

```json
[
  {
    "text": "Which date would work best for you?",
    "multiple_choice": false,
    "options": ["Option A", "Option B"]
  }
]
```

The order of questions and options must not change after creation, because votes reference them by index.

### Policies and Realtime

- RLS enabled on both tables
- Role `anon`: `SELECT` and `INSERT` on `surveys` and `votes`, no `UPDATE`, no `DELETE`
- Insert policy on `votes` (with check) rejects votes for expired surveys:

```sql
exists (
  select 1 from surveys s
  where s.id = votes.survey_id
    and (s.end_date is null or s.end_date > now())
)
```

- Realtime enabled for `votes` (live results) and `surveys` (live list)

## Project Structure

```
src/app/
  constants/        categories and limits
  interfaces/       Survey, Question, Vote types
  utils/            helper functions
  home/             home page
  create-survey/    create page
  survey-view/      detail page with live results
  survey-card/      "ending soon" card
  survey-item/      list item
  category-select/  shared category dropdown
  ends-in-pipe.ts   "Ends in 2 Days" pipe
  supabase.ts       database service
public/
  images/ icons/    static assets
src/assets/fonts/   Nerko One, Mulish, Nokora
```

## Code Conventions

- Every TypeScript function has a maximum of 14 lines
- Every function is documented in English with TSDoc
- Templates use `@if`, `@for` and `@switch`
- CSS/SCSS animations instead of Angular animations

## Known Limitations

- There is no login. Anyone can vote multiple times, and the single choice rule is enforced in the frontend only.
- The limits of 4 questions and 6 answers are enforced in the frontend only.
- Surveys cannot be edited or deleted in the app.