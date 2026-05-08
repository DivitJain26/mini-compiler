# mini-compiler
# MiniLang Compiler

MiniLang Compiler is a full-stack toy compiler built using React and Flask that demonstrates the core phases of compiler design:

- Lexical Analysis
- Syntax Analysis
- Intermediate Code Generation
- Error Handling

The project provides a modern compiler playground interface for experimenting with a simple custom programming language called MiniLang.

---

# Tech Stack

## Frontend
- React
- Vite
- TailwindCSS
- Monaco Editor

## Backend
- Flask
- Flask-CORS
- Python

---

# Project Setup

## 1. Clone Repository

```bash
git clone <your-repo-url>
cd MiniLang-Compiler
```

---

# Backend Setup

## Navigate to backend

```bash
cd backend
```

## Create Virtual Environment

### Linux / Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Run Flask Server

```bash
python app.py
```

Backend runs on:

```txt
http://localhost:5000
```

---

# Frontend Setup

## Navigate to frontend

```bash
cd frontend
```

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

# Example MiniLang Program

```txt
int x;
int y;

x = 10;

if (x > 5)
then
    y = x + 1;
else
    y = x - 1;

print(y);
```

---

# Features

- Monaco code editor
- Token generation
- Recursive descent parser
- Three-address code generation
- Lexical and syntax error reporting
- Modern responsive UI