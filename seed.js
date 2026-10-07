const { connectDB, client } = require("./db");

const sampleCourses = [
  {
    courseCode: "CS101",
    courseTitle: "Introduction to Computer Science",
    department: "Computer Science",
    instructor: "Dr. Alan Turing",
    credits: 4,
    capacity: 40,
    schedule: "Mon/Wed 10:00 AM - 11:30 AM",
    description: "Foundations of computing, algorithmic problem solving, and introduction to programming."
  },
  {
    courseCode: "CS201",
    courseTitle: "Data Structures & Algorithms",
    department: "Computer Science",
    instructor: "Prof. Donald Knuth",
    credits: 4,
    capacity: 35,
    schedule: "Tue/Thu 02:00 PM - 03:30 PM",
    description: "In-depth study of arrays, linked lists, trees, graphs, sorting, searching, and complexity analysis."
  },
  {
    courseCode: "CS305",
    courseTitle: "Web Application Engineering",
    department: "Information Technology",
    instructor: "Dr. Tim Berners-Lee",
    credits: 3,
    capacity: 30,
    schedule: "Mon/Wed 01:00 PM - 02:30 PM",
    description: "Full-stack web development covering React, Node.js, Express, REST APIs, and modern databases."
  },
  {
    courseCode: "IT210",
    courseTitle: "Database Management Systems",
    department: "Information Technology",
    instructor: "Dr. Edgar Codd",
    credits: 3,
    capacity: 30,
    schedule: "Tue/Thu 11:00 AM - 12:30 PM",
    description: "Relational database concepts, SQL, schema normalization, NoSQL MongoDB storage, and transaction control."
  },
  {
    courseCode: "AI401",
    courseTitle: "Artificial Intelligence & Machine Learning",
    department: "Artificial Intelligence",
    instructor: "Prof. Marvin Minsky",
    credits: 4,
    capacity: 25,
    schedule: "Fri 09:00 AM - 12:00 PM",
    description: "Supervised and unsupervised learning, neural networks, heuristic search, and reinforcement learning."
  }
];

async function seed() {
  try {
    const db = await connectDB();
    const coursesCollection = db.collection("Courses");
    
    // Check if courses already exist
    const count = await coursesCollection.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} courses. Skipping seed.`);
    } else {
      await coursesCollection.insertMany(sampleCourses);
      console.log(`Successfully seeded ${sampleCourses.length} initial courses!`);
    }
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await client.close();
    console.log("Database connection closed.");
  }
}

seed();
