# Experiment No. 11: Database Integration in Node.js Application Using MongoDB

## Educational Course Portal

A full-stack, responsive web application for managing technical course enrollments with real-time MongoDB Community Server integration.

---

## 📋 Project Overview

The **Educational Course Portal** provides a modern, blue-and-white themed interface where prospective students can browse technical courses, register online, and manage enrollment records. All student data is persisted directly in a local MongoDB database via the official MongoDB Node.js driver, executing real-time CRUD operations.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, MongoDB Native Driver (`mongodb`)
- **Database:** MongoDB Community Server (Local: `mongodb://127.0.0.1:27017`)
- **Frontend:** Semantic HTML5, Modern CSS3 (Custom Blue & White design system), Vanilla JavaScript (ES6+ Fetch API)
- **Icons & Fonts:** Font Awesome 6, Inter Google Font

---

## 🗄️ MongoDB Configuration

- **Connection URL:** `mongodb://127.0.0.1:27017`
- **Database Name:** `EducationalPortal`
- **Collection Name:** `Students`

---

## 📁 Project Structure

```
Experiment11/
│
├── public/
│   ├── index.html       # Single-page portal with Home, Courses, Register, Dashboard, About & Contact
│   ├── style.css        # Responsive modern blue and white stylesheet
│   └── script.js        # Client-side logic, API calls, dynamic DOM rendering & toast notifications
│
├── server.js            # Express server, MongoDB client connection, and REST API endpoints
├── package.json         # Project metadata and dependencies (express, mongodb, dotenv)
├── .env                 # Environment variables for Port, Mongo URI, DB & Collection
└── README.md            # Comprehensive project documentation
```

---

## 🚀 Setup and Execution Instructions

### 1. Prerequisites
- Ensure **Node.js** (v18+) is installed.
- Ensure **MongoDB Community Server** is running locally on port `27017`.
  - Windows Service: verify `MongoDB` service is running, or start it via Services / Command Prompt:
    ```cmd
    net start MongoDB
    ```

### 2. Install Dependencies
Open a terminal in the `Experiment11` folder:
```bash
npm install
```

### 3. Run the Application
Start the Node.js server using:
```bash
npm run dev
```
*(or `npm start`)*

### 4. Access the Web Portal
Open your web browser and navigate to:
```
http://localhost:5000
```

---

## 🔄 MongoDB CRUD Operations & API Endpoints

| Operation | HTTP Method | Endpoint | MongoDB Driver Method | Description |
| :--- | :--- | :--- | :--- | :--- |
| **CREATE** | `POST` | `/api/students` | `studentsCollection.insertOne(doc)` | Registers a student and inserts document into MongoDB. |
| **READ** | `GET` | `/api/students` | `studentsCollection.find({}).toArray()` | Retrieves all registered students from MongoDB. |
| **UPDATE** | `PUT` | `/api/students/:id` | `studentsCollection.updateOne({ _id }, { $set })` | Modifies student course & enrollment details. |
| **DELETE** | `DELETE` | `/api/students/:id` | `studentsCollection.deleteOne({ _id })` | Removes student record from MongoDB collection. |
| **STATUS** | `GET` | `/api/health` | Client ping check | Checks MongoDB connectivity and active collection. |

---

## 🧪 Testing and Verification Checklist

1. **MongoDB Connection:**
   - On server startup, console logs: `Successfully connected to MongoDB Community Server`.
   - Top status pill on website reflects `MongoDB: Connected (EducationalPortal.Students)`.
2. **Student Registration (CREATE):**
   - Fill out the registration form in the Register section.
   - Click "Register Student (Save to MongoDB)".
   - Verified that `insertOne()` saves the record and assigns a 24-character hexadecimal MongoDB `_id`.
3. **Displaying Students (READ):**
   - Dashboard automatically loads records using `find({}).toArray()`.
   - Displays student name, email, phone, enrolled course, learning mode, and enrollment date.
4. **Updating Student Details (UPDATE):**
   - Click the Edit button (pencil icon) in the Dashboard.
   - Change the enrolled course or learning mode.
   - Click "Update Details (MongoDB $set)".
   - Verified that `updateOne()` modifies the document in MongoDB.
5. **Deleting Student Records (DELETE):**
   - Click the Delete button (trash icon) in the Dashboard.
   - Confirm deletion in the prompt modal.
   - Verified that `deleteOne()` removes the document permanently from MongoDB.

