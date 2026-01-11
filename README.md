# 🚀 DocuDialog

**Chat with Your PDFs. Instantly. Intelligently. Securely.**

DocuDialog is an AI-powered SaaS application that lets users upload PDFs and interact with them conversationally. Whether it’s study material, documentation, research papers, or contracts — DocuDialog turns static PDFs into interactive knowledge companions.

Built with a **production-grade tech stack**, strong **security practices**, and a **clean developer workflow**.

---

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-API-green)
![AWS S3](https://img.shields.io/badge/AWS-S3-orange)
![Pinecone](https://img.shields.io/badge/Pinecone-VectorDB-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Clerk](https://img.shields.io/badge/Auth-Clerk-red)
![Stripe](https://img.shields.io/badge/Payments-Stripe-indigo)

## ✨ Key Features

* 📄 **Upload & Chat with PDFs**
  Ask questions, summarize content, and extract insights from your documents.

* 🧠 **AI-Powered Understanding**
  Uses advanced language models + vector search for accurate, context-aware responses.

* ☁️ **Secure File Storage (AWS S3)**
  Files are uploaded and stored securely with controlled access.

* 🔍 **Semantic Search with Pinecone**
  Fast and relevant document chunk retrieval using vector embeddings.

* 🔐 **Authentication with Clerk**
  Secure sign-in, sign-up, and user session management.

* 💳 **Stripe Payments (Planned / Integrated)**
  Ready for subscription-based monetization.

* ⚡ **Modern UI & UX**
  Built with Next.js App Router, Tailwind CSS, and responsive design.

---

## 🧱 Tech Stack

**Frontend**

* Next.js 14 (App Router)
* TypeScript
* Tailwind CSS

**Backend & Services**

* Node.js
* PostgreSQL (Neon)
* AWS S3 (File Storage)
* OpenAI (LLMs)
* Pinecone (Vector Database)
* Clerk (Authentication)
* Stripe (Payments)

---

## 🏗️ Architecture Overview

1. User uploads a PDF
2. PDF is stored securely in AWS S3
3. Content is chunked and embedded
4. Embeddings are stored in Pinecone
5. User asks questions
6. Relevant chunks are retrieved
7. AI generates accurate, contextual answers

---

## 🔐 Security First

* ✅ Secrets managed via environment variables
* ✅ `.env` files are gitignored
* ✅ `.env.example` contains placeholders only
* ✅ No API keys exposed to the client
* ✅ GitHub Push Protection compliant

> Security mistakes early in projects were intentionally fixed to follow real-world best practices.

---

## 📁 Environment Setup

Create a `.env` file locally:

```env
DATABASE_URL=your_database_url
CLERK_SECRET_KEY=your_clerk_secret
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=your_bucket_name
```

Refer to `.env.example` for the full list.

---

## ▶️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

App runs on:
👉 `http://localhost:3000`

---

## 🧪 Project Status

* ✅ Core PDF chat functionality complete
* ✅ Authentication & storage implemented
* 🚧 Subscription logic (Stripe) in progress
* 🚧 Performance & UX improvements ongoing

---

## 🌟 Why DocuDialog?

This project demonstrates:

* Real-world SaaS architecture
* Secure credential handling
* AI + vector database integration
* Clean Git workflow & commit history
* Production-focused mindset

It’s not just a demo — it’s a **scalable foundation**.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.
Feel free to open a PR or start a discussion.

---

## 📬 Contact

Built with ❤️ by **IB**
🔗 LinkedIn: [https://www.linkedin.com/in/ikrambanadarwebdev](https://www.linkedin.com/in/ikrambanadarwebdev)

---

> *“Turn documents into conversations.”*
