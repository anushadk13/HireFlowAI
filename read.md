
# User Roles

## 1. Student Portal

Purpose:

> Help candidates improve their chances before applying.

Features:

### Resume Analysis

* ATS Score
* Resume Score (/100)
* Grammar Check
* Formatting Suggestions
* Missing Skills
* Weak Bullet Points
* Keyword Optimization

---

### Job Match

Upload a Job Description.

Output:

```
Match Score

87%

Skills Match

Python ✔
SQL ✔
Docker ✖
AWS ✖

Missing Skills

Docker
AWS
Kubernetes
```

---

### AI Resume Improvement

Click:

> Improve Resume

AI rewrites

* Summary
* Experience
* Projects
* Skills

---

### AI Cover Letter

Automatically generates a cover letter.

---

### AI Interview Preparation

Based on

* Resume
* Job Description

Generate

* HR Questions
* Technical Questions
* Coding Questions
* Behavioral Questions

---

### AI Career Advisor

Student asks

> Which project should I build?

> Which certification should I take?

> Am I ready for Google?

---

### Resume Versions

Generate

* Data Scientist Resume
* Frontend Resume
* AI Engineer Resume
* Backend Resume

---

# HR Portal

This becomes much more interesting.

Instead of HR manually reviewing 500 resumes...

AI does the first screening.

---

## Dashboard

```
Applications

----------------

Total

327

Shortlisted

58

Rejected

190

Pending

79
```

---

## Upload Job Description

HR uploads

```
Software Engineer JD
```

AI extracts

* Skills
* Experience
* Degree
* Keywords
* Responsibilities

---

## Resume Screening

Candidate uploads resume.

Backend

```
Resume

↓

Extract Text

↓

Chunk

↓

Embeddings

↓

RAG

↓

Skill Extraction

↓

Score

↓

Rank
```

Output

```
Candidate

John

ATS

91%

Skill Match

88%

Projects

Excellent

Experience

Relevant

Education

Good

Recommendation

Strong Hire
```

---

## Candidate Ranking

Instead of

```
Resume 1

Resume 2

Resume 3
```

AI ranks

```
1.

92%

2.

90%

3.

86%

4.

81%
```

---

## Skill Extraction

Automatically

```
Python

SQL

React

FastAPI

Docker

AWS

TensorFlow

LangChain
```

---

## Experience Analysis

Instead of only counting years

AI understands

```
Worked on RAG

Worked on LLM

Worked on ML

Built REST APIs

Worked with AWS
```

---

## Project Evaluation

AI reads projects.

Example

```
Built Netflix Clone
```

Score

Low

Example

```
Built AI Medical Assistant
using LangChain
FastAPI
RAG
ChromaDB
```

Score

High

Reason

Complexity

Architecture

Impact

Tech Stack

---

## Resume Fraud Detection (Advanced)

Checks

Copied project?

Keyword stuffing?

Fake experience?

Repeated template?

This could later use external verification, but even heuristic checks add value.

---

## Email Automation

Candidate shortlisted?

Automatically send

```
Congratulations!

You've been shortlisted.

Please complete the assessment.
```

Rejected

```
Thank you for applying.
```

---

## Assessment Generation

AI generates MCQs.

Example

Python

```
20 Questions
```

React

```
15 Questions
```

SQL

```
10 Questions
```

---

## Auto Evaluation

Candidate submits

↓

AI checks

↓

Stores score

↓

Updates dashboard

---

## Interview Scheduling

If

Score > 80

↓

Automatically send interview slot options.

If candidate confirms

↓

Calendar updated (future enhancement with calendar integrations).

---

## HR Chatbot

HR asks

```
Show candidates
who know

Python

React

Docker
```

AI searches

```
Top 10 Candidates
```

---

## Analytics Dashboard

Charts

* Skills Distribution
* Average ATS Score
* Candidate Funnel
* Hiring Pipeline
* Top Colleges
* Experience Distribution

---

# System Architecture

```
                React Frontend

          Student Portal
                 │
                 │
          HR Dashboard
                 │
─────────────────────────────────
              FastAPI
─────────────────────────────────

Authentication

Resume Upload

JD Upload

RAG Engine

Embedding Service

Candidate Ranking

Assessment Engine

Mail Service

Analytics

─────────────────────────────────

ChromaDB

SQLite/Postgres

OpenAI/Gemini
```

---

# AI Components

| Feature               | AI? | RAG?                            |
| --------------------- | --- | ------------------------------- |
| Resume Chat           | ✅   | ✅                               |
| JD Chat               | ✅   | ✅                               |
| ATS Score             | ✅   | ❌ (rule-based + AI explanation) |
| Skill Match           | ✅   | ❌                               |
| Resume Suggestions    | ✅   | ✅                               |
| Candidate Ranking     | ✅   | ❌                               |
| Resume Search         | ✅   | ✅                               |
| Project Evaluation    | ✅   | ✅                               |
| Assessment Generation | ✅   | ❌                               |
| Interview Questions   | ✅   | ✅                               |
| HR Chatbot            | ✅   | ✅                               |
| Resume Comparison     | ✅   | ✅                               |

---

# Why this is a standout portfolio project

This isn't just another chatbot. It demonstrates:

* **Role-based application design** (Student and HR portals)
* **Frontend development** (React dashboards, uploads, analytics)
* **Backend API design** (FastAPI services and workflows)
* **RAG implementation** (resume and job description retrieval, HR search)
* **LLM integration** (analysis, suggestions, Q&A)
* **Vector search** (resume retrieval and semantic matching)
* **Workflow automation** (emails, assessments, interview progression)
* **Data visualization** (recruitment analytics)

## A good MVP scope

To keep the project achievable while still impressive, I'd recommend building it in phases:

### Phase 1 (Core RAG)

* Student uploads resume
* HR uploads job description
* Resume–JD matching
* ATS score
* AI chat over resume and JD

### Phase 2 (Hiring Workflow)

* Candidate ranking
* Skill extraction
* Project evaluation
* Resume search
* HR dashboard

### Phase 3 (Automation)

* Email notifications
* AI-generated assessments
* Auto-evaluation of assessments
* Interview invitation workflow
* Analytics dashboard

By the end, you'll have a project that resembles a simplified AI-powered Applicant Tracking System (ATS) with RAG and intelligent automation—exactly the kind of end-to-end application that demonstrates skills employers look for in AI/ML and full-stack engineering candidates.
