# 🚀 Notebook RAG: Next-Gen Document Intelligence
### **Architected & Developed by Abdul Kalam Azad**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76B900?style=for-the-badge&logo=nvidia)](https://www.nvidia.com/en-us/ai-data-science/generative-ai/nim/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**Notebook RAG** is a professional-grade, high-performance Retrieval-Augmented Generation (RAG) platform. It is engineered to transform static data—PDFs, CSVs, and plain text—into dynamic, interactive intelligence partners with unmatched surgical precision and zero-latency retrieval.

---

## 💎 The Philosophy: Ground Truth First
In a world of AI hallucinations, **Notebook RAG** stands apart. This platform is built on a deterministic pipeline that ensures every response is anchored in reality. If it's not in your document, the AI won't invent it.

### **✨ Why Choose Notebook RAG?**
- **SOTA Orchestration**: Leverages the power of **Llama 3.1 70B** for human-level reasoning.
- **Deterministic Retrieval**: Custom-built vector engine ensures the most relevant data is always prioritized.
- **Zero-Latency**: In-memory architecture provides sub-millisecond response preparation.
- **Scholarly Aesthetics**: A premium, distraction-free environment optimized for long-form research.

---

## 🧠 Technical Deep Dive

### **1. Advanced Embedding Core**
Using the **NVIDIA nv-embedqa-e5-v5** model, we map your documents into a 1024-dimension semantic space. This allows the system to understand the *meaning* behind your words, not just the keywords.
- **Precision Grounding**: Enforces strict adherence to retrieved context.
- **Cross-Format Support**: Seamlessly indexes complex PDFs and structured CSV data.

### **2. Proprietary Vector Engine**
While others rely on external APIs, I implemented a **Custom Vector Store** from scratch to eliminate network overhead:
- **Cosine Similarity Scoring**: Mathematical precision in ranking document relevance.
- **Recursive Chunking**: Smart text splitting (~900 chars) with semantic overlap (150 chars) to maintain context across boundaries.

### **3. Research-First UI/UX**
The interface is a tailor-made "Research Environment" designed for maximum productivity:
- **Real-Time Citations**: Streamed answers include automated `[N]` citations that link directly to the source.
- **Source Inspection**: Instantly view the exact paragraph the AI used to generate its answer.
- **Responsive HUD**: A fully mobile-responsive dashboard with a collapsible command center.

---

## 🛠️ Tech Stack & Infrastructure

| Component | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS 4.0 |
| **Model** | Meta Llama 3.1 70B Instruct |
| **Embeddings** | NVIDIA nv-embedqa-e5-v5 |
| **Inference** | NVIDIA NIM API |
| **Logic** | TypeScript (Strict Mode) |

---

## ⚙️ Installation & Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/abdulkalamazad1001/notebook-rag-ai.git
   cd notebook-rag-ai
   npm install
   ```

2. **Configure Environment**
   Create a `.env.local` in the root directory:
   ```env
   NVIDIA_API_KEY=your_nvidia_nim_key_here
   ```

3. **Deploy Locally**
   ```bash
   npm run dev
   ```

---

<div align="center">
  <p><b>Developed with Passion by <a href="https://github.com/abdulkalamazad1001">Abdul Kalam Azad</a></b></p>
</div>
