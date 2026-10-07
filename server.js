const express = require("express");
const path = require("path");
const cors = require("cors");
const { connectDB, ObjectId } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
const clientBuildPath = path.join(__dirname, "client", "build");
app.use(express.static(clientBuildPath));
app.use(express.static(path.join(__dirname, "public")));

let db;
let coursesCollection;
let registrationsCollection;

// Helper to convert string to ObjectId safely
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// COURSE ROUTES
// -------------------------------------------------------------

// 1. Get all courses with live enrollment and available seats
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await coursesCollection.find({}).toArray();

    // Calculate enrollments for each course
    const coursesWithEnrollments = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount = await registrationsCollection.countDocuments({
          courseId: course._id.toString()
        });
        const capacity = Number(course.capacity) || 30;
        const availableSeats = Math.max(0, capacity - enrolledCount);
        return {
          ...course,
          enrolledCount,
          availableSeats
        };
      })
    );

    res.json(coursesWithEnrollments);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// 2. Get single course by ID
app.get("/api/courses/:id", async (req, res) => {
  try {
    const objId = toObjectId(req.params.id);
    if (!objId) return res.status(400).json({ error: "Invalid Course ID" });

    const course = await coursesCollection.findOne({ _id: objId });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrolledCount = await registrationsCollection.countDocuments({
      courseId: course._id.toString()
    });
    const capacity = Number(course.capacity) || 30;

    res.json({
      ...course,
      enrolledCount,
      availableSeats: Math.max(0, capacity - enrolledCount)
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch course details" });
  }
});

// 3. Admin: Add a new course
app.post("/api/courses", async (req, res) => {
  try {
    const {
      courseCode,
      courseTitle,
      department,
      instructor,
      credits,
      capacity,
      schedule,
      description
    } = req.body;

    if (!courseCode || !courseTitle || !instructor) {
      return res.status(400).json({
        error: "Course Code, Course Title, and Instructor are required."
      });
    }

    // Check duplicate course code
    const existing = await coursesCollection.findOne({
      courseCode: courseCode.trim().toUpperCase()
    });
    if (existing) {
      return res.status(400).json({
        error: `Course with code ${courseCode.toUpperCase()} already exists.`
      });
    }

    const newCourse = {
      courseCode: courseCode.trim().toUpperCase(),
      courseTitle: courseTitle.trim(),
      department: (department || "General").trim(),
      instructor: instructor.trim(),
      credits: Number(credits) || 3,
      capacity: Number(capacity) || 30,
      schedule: (schedule || "TBA").trim(),
      description: (description || "").trim(),
      createdAt: new Date()
    };

    const result = await coursesCollection.insertOne(newCourse);
    res.status(201).json({
      message: "Course created successfully",
      course: { ...newCourse, _id: result.insertedId, enrolledCount: 0, availableSeats: newCourse.capacity }
    });
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// 4. Admin: Update course
app.put("/api/courses/:id", async (req, res) => {
  try {
    const objId = toObjectId(req.params.id);
    if (!objId) return res.status(400).json({ error: "Invalid Course ID" });

    const {
      courseCode,
      courseTitle,
      department,
      instructor,
      credits,
      capacity,
      schedule,
      description
    } = req.body;

    const updateFields = {
      courseTitle: courseTitle ? courseTitle.trim() : undefined,
      department: department ? department.trim() : undefined,
      instructor: instructor ? instructor.trim() : undefined,
      credits: credits ? Number(credits) : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      schedule: schedule ? schedule.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
      updatedAt: new Date()
    };

    if (courseCode) {
      updateFields.courseCode = courseCode.trim().toUpperCase();
    }

    // Clean undefined fields
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const result = await coursesCollection.updateOne(
      { _id: objId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ message: "Course updated successfully" });
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// 5. Admin: Delete course
app.delete("/api/courses/:id", async (req, res) => {
  try {
    const objId = toObjectId(req.params.id);
    if (!objId) return res.status(400).json({ error: "Invalid Course ID" });

    const result = await coursesCollection.deleteOne({ _id: objId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Also remove associated registrations
    await registrationsCollection.deleteMany({ courseId: req.params.id });

    res.json({ message: "Course and related registrations deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// -------------------------------------------------------------
// STUDENT REGISTRATION ROUTES
// -------------------------------------------------------------

// 6. Student: Register for a course
app.post("/api/register", async (req, res) => {
  try {
    const { courseId, studentName, studentId, studentEmail } = req.body;

    if (!courseId || !studentName || !studentId) {
      return res.status(400).json({
        error: "Course ID, Student Name, and Student ID/Roll No are required."
      });
    }

    const objId = toObjectId(courseId);
    if (!objId) return res.status(400).json({ error: "Invalid Course ID" });

    const course = await coursesCollection.findOne({ _id: objId });
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Check duplicate registration
    const existingRegistration = await registrationsCollection.findOne({
      courseId: courseId,
      studentId: studentId.trim().toUpperCase()
    });

    if (existingRegistration) {
      return res.status(400).json({
        error: `Student ${studentId} is already registered for ${course.courseCode} (${course.courseTitle}).`
      });
    }

    // Check capacity
    const currentEnrolled = await registrationsCollection.countDocuments({
      courseId: courseId
    });

    if (currentEnrolled >= (Number(course.capacity) || 30)) {
      return res.status(400).json({
        error: "Registration failed: This course has reached full capacity."
      });
    }

    const newRegistration = {
      courseId: courseId,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      instructor: course.instructor,
      credits: course.credits,
      schedule: course.schedule,
      studentName: studentName.trim(),
      studentId: studentId.trim().toUpperCase(),
      studentEmail: (studentEmail || "").trim().toLowerCase(),
      registeredAt: new Date()
    };

    const regResult = await registrationsCollection.insertOne(newRegistration);

    res.status(201).json({
      message: `Successfully registered for ${course.courseCode}: ${course.courseTitle}!`,
      registration: { ...newRegistration, _id: regResult.insertedId }
    });
  } catch (err) {
    console.error("Error registering for course:", err);
    res.status(500).json({ error: "Registration process failed." });
  }
});

// 7. Get registrations (optional filters: ?studentId=... or ?courseId=...)
app.get("/api/registrations", async (req, res) => {
  try {
    const { studentId, courseId } = req.query;
    const query = {};

    if (studentId) {
      query.studentId = studentId.trim().toUpperCase();
    }
    if (courseId) {
      query.courseId = courseId;
    }

    const registrations = await registrationsCollection
      .find(query)
      .sort({ registeredAt: -1 })
      .toArray();

    res.json(registrations);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// 8. Student/Admin: Drop or cancel registration
app.delete("/api/registrations/:id", async (req, res) => {
  try {
    const objId = toObjectId(req.params.id);
    if (!objId) return res.status(400).json({ error: "Invalid Registration ID" });

    const result = await registrationsCollection.deleteOne({ _id: objId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Registration not found" });
    }

    res.json({ message: "Registration cancelled successfully (course dropped)." });
  } catch (err) {
    console.error("Error deleting registration:", err);
    res.status(500).json({ error: "Failed to cancel registration" });
  }
});

// Fallback for SPA routing (Express 5 compatible)
app.use((req, res) => {
  const indexPath = path.join(clientBuildPath, "index.html");
  res.sendFile(indexPath);
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
async function start() {
  try {
    db = await connectDB();
    coursesCollection = db.collection("Courses");
    registrationsCollection = db.collection("Registrations");

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`Course Registration System Server Running!`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

start();
