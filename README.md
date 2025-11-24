# AI Document Generator

A full-stack web application that allows users to generate, refine, and export structured business documents (.docx and .pptx) using Google Gemini AI.

## Features
- **User Authentication**: Secure login and registration via **Firebase Authentication**.
- **Project Management**: Create and manage document projects.
- **Document Configuration**: Choose between Word and PowerPoint formats.
- **AI Content Generation**: Generate outlines and content using Gemini AI.
- **Interactive Refinement**: Refine specific sections with AI prompts.
- **Export**: Download documents in .docx or .pptx format.

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, SQLite, Google Generative AI, Firebase Admin SDK
- **Frontend**: React, Vite, Tailwind CSS, Axios, Firebase SDK

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- Google Gemini API Key
- Firebase Project (Web App & Service Account)

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. **Firebase Setup**:
   - Place your `serviceAccountKey.json` file in the `backend` directory.
5. **Environment Variables**:
   - Create a `.env` file in `backend` and add:
     ```
     GEMINI_API_KEY=your_api_key_here
     SECRET_KEY=your_secret_key_here
     ```
6. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. **Firebase Setup**:
   - Ensure `src/firebase.js` contains your Firebase configuration.
4. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Usage
1. Register for a new account (handled by Firebase).
2. Click "New Project" on the dashboard.
3. Select Document Type (Word or PowerPoint).
4. Enter a topic (e.g., "AI in Healthcare").
5. The system will generate an outline.
6. In the Editor, click "Generate Content" for each section.
7. Use the "Refine" input to tweak specific sections.
8. Click "Export" to download the final document.
