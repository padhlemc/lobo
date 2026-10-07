import React, { useState, useEffect } from "react";
import "./App.css";

const API_BASE = "http://localhost:4000/api";

function App() {
  const [activeTab, setActiveTab] = useState("student"); // 'student', 'my-courses', 'admin'
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  // Student credentials stored in state / localStorage
  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem("studentProfile");
    return saved
      ? JSON.parse(saved)
      : { studentId: "STU-101", studentName: "Aryan Chaurasia", studentEmail: "aryan@example.com" };
  });

  const [myRegistrations, setMyRegistrations] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Registration Modal state
  const [registeringCourse, setRegisteringCourse] = useState(null);
  const [regForm, setRegForm] = useState({
    studentName: studentProfile.studentName,
    studentId: studentProfile.studentId,
    studentEmail: studentProfile.studentEmail,
  });

  // Admin New Course Form
  const [newCourse, setNewCourse] = useState({
    courseCode: "",
    courseTitle: "",
    department: "Computer Science",
    instructor: "",
    credits: 3,
    capacity: 30,
    schedule: "Mon/Wed 10:00 AM",
    description: "",
  });

  // Admin Edit Course Modal state
  const [editingCourse, setEditingCourse] = useState(null);

  // Admin View Enrolled Students Modal
  const [viewingEnrollments, setViewingEnrollments] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Show Toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4000);
  };

  // 1. Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses`);
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch my registered courses
  const fetchMyRegistrations = async () => {
    if (!studentProfile.studentId) return;
    try {
      const res = await fetch(`${API_BASE}/registrations?studentId=${encodeURIComponent(studentProfile.studentId)}`);
      if (!res.ok) throw new Error("Failed to load registered courses");
      const data = await res.json();
      setMyRegistrations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMyRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfile.studentId]);

  // Save student profile to localStorage
  const handleProfileSave = (e) => {
    e.preventDefault();
    localStorage.setItem("studentProfile", JSON.stringify(studentProfile));
    setRegForm({
      studentName: studentProfile.studentName,
      studentId: studentProfile.studentId,
      studentEmail: studentProfile.studentEmail,
    });
    showToast("Student profile updated!");
    fetchMyRegistrations();
  };

  // 3. Register for Course
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registeringCourse) return;

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: registeringCourse._id,
          studentName: regForm.studentName,
          studentId: regForm.studentId,
          studentEmail: regForm.studentEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      showToast(data.message, "success");
      setRegisteringCourse(null);
      fetchCourses();
      fetchMyRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // 4. Drop Registration
  const handleDropRegistration = async (registrationId, courseCode) => {
    if (!window.confirm(`Are you sure you want to drop course ${courseCode}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/registrations/${registrationId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to drop course");

      showToast(`Successfully dropped ${courseCode}`, "success");
      fetchCourses();
      fetchMyRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // 5. Admin: Create New Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create course");

      showToast(`Course ${newCourse.courseCode} added successfully!`, "success");
      setNewCourse({
        courseCode: "",
        courseTitle: "",
        department: "Computer Science",
        instructor: "",
        credits: 3,
        capacity: 30,
        schedule: "Mon/Wed 10:00 AM",
        description: "",
      });
      fetchCourses();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // 6. Admin: Update Course
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const res = await fetch(`${API_BASE}/courses/${editingCourse._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourse),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update course");

      showToast("Course updated successfully!", "success");
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // 7. Admin: Delete Course
  const handleDeleteCourse = async (courseId, courseCode) => {
    if (!window.confirm(`Are you sure you want to delete course ${courseCode}? All student registrations will be removed.`)) return;

    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete course");

      showToast(`Course ${courseCode} deleted successfully!`, "success");
      fetchCourses();
      fetchMyRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // 8. Admin: View Enrolled Students for Course
  const handleViewEnrollments = async (course) => {
    setViewingEnrollments(course);
    setLoadingEnrollments(true);
    try {
      const res = await fetch(`${API_BASE}/registrations?courseId=${course._id}`);
      if (!res.ok) throw new Error("Failed to load enrolled students");
      const data = await res.json();
      setEnrolledStudents(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Filter courses
  const departments = ["ALL", ...new Set(courses.map((c) => c.department || "General"))];
  const filteredCourses = courses.filter((c) => {
    const matchesDept = selectedDept === "ALL" || c.department === selectedDept;
    const matchesSearch =
      (c.courseCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.courseTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.instructor || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Check if current student is already registered for a course
  const isRegistered = (courseId) => {
    return myRegistrations.some((r) => r.courseId === courseId);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Top Header */}
      <header className="navbar">
        <div className="brand">
          <h2>🎓 University Course Portal</h2>
          <span className="subtitle">React + Node.js + Express + MongoDB</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === "student" ? "active" : ""}`}
            onClick={() => setActiveTab("student")}
          >
            Course Catalog
          </button>
          <button
            className={`tab-btn ${activeTab === "my-courses" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("my-courses");
              fetchMyRegistrations();
            }}
          >
            My Registrations ({myRegistrations.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            Admin Dashboard
          </button>
        </nav>
      </header>

      {/* Student Profile Bar */}
      <div className="student-bar">
        <form onSubmit={handleProfileSave} className="profile-form">
          <span className="profile-label">👤 Current Student:</span>
          <input
            type="text"
            placeholder="Student Name"
            value={studentProfile.studentName}
            onChange={(e) =>
              setStudentProfile({ ...studentProfile, studentName: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Roll / ID (e.g. STU-101)"
            value={studentProfile.studentId}
            onChange={(e) =>
              setStudentProfile({ ...studentProfile, studentId: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={studentProfile.studentEmail}
            onChange={(e) =>
              setStudentProfile({ ...studentProfile, studentEmail: e.target.value })
            }
          />
          <button type="submit" className="btn-secondary">
            Save Profile
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        {/* ========================================================= */}
        {/* TAB 1: STUDENT VIEW - AVAILABLE COURSES                   */}
        {/* ========================================================= */}
        {activeTab === "student" && (
          <section className="portal-section">
            <div className="section-header">
              <div>
                <h3>Available Courses</h3>
                <p>Browse courses and register for your semester subjects</p>
              </div>
              <button onClick={fetchCourses} className="btn-secondary">
                🔄 Refresh
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="toolbar">
              <input
                type="text"
                placeholder="🔍 Search by course code, title, or instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />

              <div className="filter-group">
                <label>Department:</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course Cards Grid */}
            {loading ? (
              <div className="loading-box">Loading available courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="empty-box">No courses match your criteria.</div>
            ) : (
              <div className="course-grid">
                {filteredCourses.map((course) => {
                  const registered = isRegistered(course._id);
                  const isFull = course.availableSeats <= 0;

                  return (
                    <div key={course._id} className="course-card">
                      <div className="card-top">
                        <span className="course-code">{course.courseCode}</span>
                        <span className="credits-badge">{course.credits} Credits</span>
                      </div>

                      <h4 className="course-title">{course.courseTitle}</h4>
                      <p className="course-dept">🏛️ {course.department || "General"}</p>

                      <div className="course-details">
                        <p><strong>👨‍🏫 Instructor:</strong> {course.instructor}</p>
                        <p><strong>🕒 Schedule:</strong> {course.schedule || "TBA"}</p>
                        {course.description && (
                          <p className="course-desc">{course.description}</p>
                        )}
                      </div>

                      <div className="seat-status">
                        <span>
                          Seats: <strong>{course.availableSeats}</strong> / {course.capacity} available
                        </span>
                        <span className={isFull ? "badge-full" : "badge-open"}>
                          {isFull ? "Full" : "Open"}
                        </span>
                      </div>

                      <div className="card-action">
                        {registered ? (
                          <button className="btn-registered" disabled>
                            ✓ Already Registered
                          </button>
                        ) : isFull ? (
                          <button className="btn-disabled" disabled>
                            No Seats Available
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={() => {
                              setRegisteringCourse(course);
                              setRegForm({
                                studentName: studentProfile.studentName,
                                studentId: studentProfile.studentId,
                                studentEmail: studentProfile.studentEmail,
                              });
                            }}
                          >
                            Register for Course
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MY REGISTRATIONS                                   */}
        {/* ========================================================= */}
        {activeTab === "my-courses" && (
          <section className="portal-section">
            <div className="section-header">
              <div>
                <h3>My Registered Courses</h3>
                <p>Showing courses enrolled under Roll/ID: <strong>{studentProfile.studentId}</strong></p>
              </div>
              <button onClick={fetchMyRegistrations} className="btn-secondary">
                🔄 Refresh
              </button>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="empty-box">
                <p>You have not registered for any courses yet.</p>
                <button
                  className="btn-primary"
                  style={{ marginTop: "10px" }}
                  onClick={() => setActiveTab("student")}
                >
                  Browse Course Catalog
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Instructor</th>
                      <th>Credits</th>
                      <th>Schedule</th>
                      <th>Registered On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRegistrations.map((reg) => (
                      <tr key={reg._id}>
                        <td><strong>{reg.courseCode}</strong></td>
                        <td>{reg.courseTitle}</td>
                        <td>{reg.instructor}</td>
                        <td>{reg.credits}</td>
                        <td>{reg.schedule || "-"}</td>
                        <td>{new Date(reg.registeredAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-danger"
                            onClick={() =>
                              handleDropRegistration(reg._id, reg.courseCode)
                            }
                          >
                            Drop Course
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ADMIN DASHBOARD (ADD, UPDATE, DELETE COURSES)       */}
        {/* ========================================================= */}
        {activeTab === "admin" && (
          <section className="portal-section">
            <div className="section-header">
              <div>
                <h3>Admin Course Management</h3>
                <p>Add new courses, modify curriculum, monitor enrollments, and delete courses</p>
              </div>
              <button onClick={fetchCourses} className="btn-secondary">
                🔄 Refresh Courses
              </button>
            </div>

            {/* Admin Stats Row */}
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-num">{courses.length}</span>
                <span className="stat-label">Total Courses</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">
                  {courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)}
                </span>
                <span className="stat-label">Total Enrolled Students</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">
                  {courses.reduce((acc, c) => acc + (c.availableSeats || 0), 0)}
                </span>
                <span className="stat-label">Total Remaining Seats</span>
              </div>
            </div>

            {/* Add Course Form Section */}
            <div className="admin-form-card">
              <h4>➕ Add New Course</h4>
              <form onSubmit={handleCreateCourse} className="course-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. CS301"
                      value={newCourse.courseCode}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, courseCode: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Course Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Operating Systems"
                      value={newCourse.courseTitle}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, courseTitle: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={newCourse.department}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, department: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Instructor Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Dennis Ritchie"
                      value={newCourse.instructor}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, instructor: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newCourse.credits}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, credits: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Seat Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={newCourse.capacity}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, capacity: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Schedule / Timing</label>
                    <input
                      type="text"
                      placeholder="e.g. Mon/Wed 10:00 AM"
                      value={newCourse.schedule}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, schedule: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Course Description</label>
                  <textarea
                    rows="2"
                    placeholder="Brief description of course syllabus and objectives..."
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, description: e.target.value })
                    }
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary">
                  Add Course to System
                </button>
              </form>
            </div>

            {/* Courses Management Table */}
            <div className="admin-table-card">
              <h4>📋 Existing Courses</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Title</th>
                      <th>Department</th>
                      <th>Instructor</th>
                      <th>Credits</th>
                      <th>Capacity</th>
                      <th>Enrolled</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id}>
                        <td><strong>{course.courseCode}</strong></td>
                        <td>{course.courseTitle}</td>
                        <td>{course.department}</td>
                        <td>{course.instructor}</td>
                        <td>{course.credits}</td>
                        <td>{course.capacity}</td>
                        <td>
                          <button
                            className="btn-link"
                            onClick={() => handleViewEnrollments(course)}
                          >
                            {course.enrolledCount} Students 👁️
                          </button>
                        </td>
                        <td>
                          <span
                            className={
                              course.availableSeats <= 0
                                ? "text-danger"
                                : "text-success"
                            }
                          >
                            {course.availableSeats}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-secondary"
                              onClick={() => setEditingCourse(course)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() =>
                                handleDeleteCourse(course._id, course.courseCode)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: REGISTER FOR COURSE                              */}
      {/* ========================================================= */}
      {registeringCourse && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h4>Register for Course</h4>
              <button
                className="btn-close"
                onClick={() => setRegisteringCourse(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-course-summary">
                <p><strong>Course:</strong> {registeringCourse.courseCode} - {registeringCourse.courseTitle}</p>
                <p><strong>Instructor:</strong> {registeringCourse.instructor}</p>
                <p><strong>Credits:</strong> {registeringCourse.credits} | <strong>Available Seats:</strong> {registeringCourse.availableSeats}</p>
              </div>

              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label>Student Full Name *</label>
                  <input
                    type="text"
                    value={regForm.studentName}
                    onChange={(e) =>
                      setRegForm({ ...regForm, studentName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Roll Number / Student ID *</label>
                  <input
                    type="text"
                    value={regForm.studentId}
                    onChange={(e) =>
                      setRegForm({ ...regForm, studentId: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Student Email</label>
                  <input
                    type="email"
                    value={regForm.studentEmail}
                    onChange={(e) =>
                      setRegForm({ ...regForm, studentEmail: e.target.value })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setRegisteringCourse(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Confirm Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADMIN EDIT COURSE                                */}
      {/* ========================================================= */}
      {editingCourse && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h4>Edit Course ({editingCourse.courseCode})</h4>
              <button
                className="btn-close"
                onClick={() => setEditingCourse(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleUpdateCourse}>
                <div className="form-group">
                  <label>Course Title</label>
                  <input
                    type="text"
                    value={editingCourse.courseTitle}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        courseTitle: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={editingCourse.department || ""}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          department: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Instructor</label>
                    <input
                      type="text"
                      value={editingCourse.instructor}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          instructor: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingCourse.credits}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          credits: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Seat Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={editingCourse.capacity}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          capacity: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Schedule</label>
                  <input
                    type="text"
                    value={editingCourse.schedule || ""}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        schedule: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={editingCourse.description || ""}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        description: e.target.value,
                      })
                    }
                  ></textarea>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingCourse(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: VIEW ENROLLED STUDENTS (ADMIN)                   */}
      {/* ========================================================= */}
      {viewingEnrollments && (
        <div className="modal-backdrop">
          <div className="modal-box modal-large">
            <div className="modal-header">
              <h4>
                Enrolled Students: {viewingEnrollments.courseCode} - {viewingEnrollments.courseTitle}
              </h4>
              <button
                className="btn-close"
                onClick={() => setViewingEnrollments(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {loadingEnrollments ? (
                <p>Loading enrolled students...</p>
              ) : enrolledStudents.length === 0 ? (
                <p>No students have registered for this course yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Roll / ID</th>
                        <th>Email</th>
                        <th>Registration Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map((s, idx) => (
                        <tr key={s._id}>
                          <td>{idx + 1}</td>
                          <td><strong>{s.studentName}</strong></td>
                          <td>{s.studentId}</td>
                          <td>{s.studentEmail || "-"}</td>
                          <td>{new Date(s.registeredAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: "16px" }}>
                <button
                  className="btn-secondary"
                  onClick={() => setViewingEnrollments(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
