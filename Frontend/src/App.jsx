import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Register from "./Pages/Register"
import Login from "./Pages/Login"
import DashboardLecturers from "./Pages/DashboardLecturers/DashboardLecturers";
import LecturerRatings from "./Pages/DashboardLecturers/LecturerRatings"
import MonitoringLecturers from "./Pages/DashboardLecturers/LMonitoring"
import Reports from "./Pages/DashboardLecturers/LecturerReports";


import DashboardPRL from "./Pages/DashboardPRL/DashboardPRL";
import CoursesPRL from "./Pages/DashboardPRL/CoursesPRL";
import ReportsPRL from "./Pages/DashboardPRL/ReportsPRL";
import MonitoringPRL from "./Pages/DashboardPRL/MonitoringPRL";
import RatingsPRL from "./Pages/DashboardPRL/RatingsPRL";

import DashboardPL from "./Pages/DashboardPL/DashboardPL";
import PLCourses from "./Pages/DashboardPL/PLCourses";
import MonitoringPL from "./Pages/DashboardPL/PLMonitoring";
import ReportsPL from "./Pages/DashboardPL/ReportsPL";

import DashboardStudents from "./Pages/DashboardStudents/DashboardStudents";
import Ratings from "./Pages/DashboardStudents/Ratings"
import StudentMonitoring from "./Pages/DashboardStudents/Monitoring";


import FMGDashboard from "./Pages/FMG/FMG";
import StreamsManagement from "./Pages/FMG/Streams";
import EnrollmentsManagement from "./Pages/FMG/Enrollments";
import FMGCoursesManagement from "./Pages/FMG/FMGCourses";
import FMGMonitoring from "./Pages/FMG/FMGMonitoring";



export default function App() {
  return (
    <Router>
      <Routes>
      
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/student" element={<DashboardStudents />} />
        <Route path="/student/ratings" element={<Ratings />} />
        <Route path="/student/monitoring" element={<StudentMonitoring/>} />


        <Route path="/lecturer" element={<DashboardLecturers />} />
        <Route path="/lecturer/ratings" element={<LecturerRatings />} />
        <Route path="/lecturer/monitoring" element={<MonitoringLecturers />} />
        <Route path="/lecturer/reports" element={<Reports/>}/>


        <Route path="/login" element={<Login />} />
        <Route path="/prl" element={<DashboardPRL />} />
        <Route path="/prl/courses" element={<CoursesPRL />} />
        <Route path="/prl/reports" element={<ReportsPRL />} />
        <Route path="/prl/monitoring" element={<MonitoringPRL />} />
        <Route path="/prl/ratings" element={<RatingsPRL />} />
        
        <Route path="*" element={<Navigate to="/prl" replace />} /> {/*catch for prl page to prevent address accumulation */}

        <Route path="/pl" element={<DashboardPL />} />
        <Route path="pl/courses" element={<PLCourses/>}/>
        <Route path="/pl/ratings" element={<Ratings />} />
        <Route path="/pl/monitoring" element={<MonitoringPL />} />
        <Route path="pl/reports" element={<ReportsPL/>}/>


        <Route path="/admin" element={<FMGDashboard />} />
        <Route path="/admin/streams" element={<StreamsManagement/>}/>
        <Route path="admin/courses" element={<FMGCoursesManagement/>}/>
        <Route path="/admin/enrollments" element={<EnrollmentsManagement/>}/>
        <Route path="/admin/ratings" element={<Ratings />} />
        <Route path="/admin/monitoring" element={<FMGMonitoring />} />

      </Routes>
    </Router>
  )
}