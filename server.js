const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'EducationalPortal';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'Students';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Client & Collection reference
const client = new MongoClient(MONGODB_URI);
let studentsCollection;
let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    studentsCollection = db.collection(COLLECTION_NAME);
    console.log('====================================================');
    console.log(' Successfully connected to MongoDB Community Server');
    console.log(` Connection URI: ${MONGODB_URI}`);
    console.log(` Database:       ${DB_NAME}`);
    console.log(` Collection:     ${COLLECTION_NAME}`);
    console.log('====================================================');
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    console.error('Make sure your local MongoDB Community Server is running on port 27017.');
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health / Connection Check Route
app.get('/api/health', (req, res) => {
  const isConnected = !!studentsCollection;
  res.json({
    status: isConnected ? 'connected' : 'disconnected',
    database: DB_NAME,
    collection: COLLECTION_NAME,
    timestamp: new Date().toISOString()
  });
});

// CREATE: Register student (insertOne)
// POST /api/students
app.post('/api/students', async (req, res) => {
  try {
    if (!studentsCollection) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected. Please ensure MongoDB is running.'
      });
    }

    const { name, email, phone, course, enrollmentDate, learningMode, notes } = req.body;

    // Basic validation
    if (!name || !email || !course) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and course are required fields.'
      });
    }

    const studentDocument = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : 'N/A',
      course: course.trim(),
      learningMode: learningMode || 'Online',
      enrollmentDate: enrollmentDate || new Date().toISOString().split('T')[0],
      notes: notes ? notes.trim() : '',
      createdAt: new Date()
    };

    // Save details using insertOne()
    const result = await studentsCollection.insertOne(studentDocument);

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully in MongoDB.',
      studentId: result.insertedId,
      data: { _id: result.insertedId, ...studentDocument }
    });
  } catch (error) {
    console.error('Error in POST /api/students:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register student: ' + error.message
    });
  }
});

// READ: Retrieve and display all students (find({}).toArray())
// GET /api/students
app.get('/api/students', async (req, res) => {
  try {
    if (!studentsCollection) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected. Please ensure MongoDB is running.'
      });
    }

    // Retrieve all students using find({}).toArray()
    const students = await studentsCollection.find({}).sort({ createdAt: -1 }).toArray();

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error in GET /api/students:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve students: ' + error.message
    });
  }
});

// UPDATE: Modify student course and details using updateOne() and $set
// PUT /api/students/:id
app.put('/api/students/:id', async (req, res) => {
  try {
    if (!studentsCollection) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected. Please ensure MongoDB is running.'
      });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID format.'
      });
    }

    const { name, email, phone, course, learningMode, enrollmentDate, notes } = req.body;

    const updateFields = {};
    if (course !== undefined) updateFields.course = course.trim();
    if (name !== undefined) updateFields.name = name.trim();
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (learningMode !== undefined) updateFields.learningMode = learningMode;
    if (enrollmentDate !== undefined) updateFields.enrollmentDate = enrollmentDate;
    if (notes !== undefined) updateFields.notes = notes.trim();
    updateFields.updatedAt = new Date();

    // Modify student course details using updateOne() and $set
    const result = await studentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student details successfully updated in MongoDB.',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in PUT /api/students/:id:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update student: ' + error.message
    });
  }
});

// DELETE: Delete student record using deleteOne()
// DELETE /api/students/:id
app.delete('/api/students/:id', async (req, res) => {
  try {
    if (!studentsCollection) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected. Please ensure MongoDB is running.'
      });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID format.'
      });
    }

    // Delete student records using deleteOne()
    const result = await studentsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student record successfully deleted from MongoDB.'
    });
  } catch (error) {
    console.error('Error in DELETE /api/students/:id:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete student: ' + error.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`EduCourse Portal server is running at http://localhost:${PORT}`);
  await connectToDatabase();
});

