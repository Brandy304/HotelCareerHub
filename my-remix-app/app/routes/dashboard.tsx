import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "@remix-run/react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: {
    min: number;
    max: number;
  };
  status: "active" | "closed";
  recruiter: {
    username: string;
    email: string;
  };
  createdAt: string;
}

interface Application {
  _id: string;
  job: {
    title: string;
    company: string;
  };
  applicant: {
    username: string;
    email: string;
  };
  recruiter: {
    username: string;
    email: string;
  };
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    if (activeTab === "jobs") {
      fetchJobs();
    } else {
      fetchApplications();
    }
  }, [activeTab]);

  const checkAdminAccess = async () => {
    try {
      const response = await axios.get("http://localhost:3000/users/current", {
        withCredentials: true,
      });
      if (response.data.role !== "admin") {
        navigate("/login");
      }
    } catch (err) {
      navigate("/login");
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:3000/admin/jobs", {
        withCredentials: true,
      });
      setJobs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch jobs");
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/admin/applications",
        {
          withCredentials: true,
        }
      );
      setApplications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch applications");
    }
  };

  const handleJobStatusChange = async (
    jobId: string,
    newStatus: "active" | "closed"
  ) => {
    try {
      await axios.patch(
        `http://localhost:3000/admin/jobs/${jobId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      setSuccess("Job status updated successfully");
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`http://localhost:3000/admin/jobs/${jobId}`, {
        withCredentials: true,
      });
      setSuccess("Job deleted successfully");
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete job");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all jobs and applications
          </p>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {/* 标签切换 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`${
                activeTab === "jobs"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Jobs Management
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`${
                activeTab === "applications"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Applications Management
            </button>
          </nav>
        </div>

        {/* 职位列表 */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white shadow-sm rounded-lg border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {job.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={job.status}
                      onChange={(e) =>
                        handleJobStatusChange(
                          job._id,
                          e.target.value as "active" | "closed"
                        )
                      }
                      className={`rounded-full text-sm font-medium px-3 py-1 ${
                        job.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Posted by: </span>
                      {job.recruiter.username} ({job.recruiter.email})
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Salary Range: </span>
                      {job.salary.min / 1000}k - {job.salary.max / 1000}k
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Posted on: </span>
                      {formatDate(job.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 申请列表 */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            {applications.map((application) => (
              <div
                key={application._id}
                className="bg-white shadow-sm rounded-lg border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {application.job.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {application.job.company}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      application.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : application.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {application.status === "pending" && "Pending"}
                    {application.status === "accepted" && "Accepted"}
                    {application.status === "rejected" && "Rejected"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Applicant: </span>
                      {application.applicant.username} (
                      {application.applicant.email})
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Recruiter: </span>
                      {application.recruiter.username} (
                      {application.recruiter.email})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Applied on: </span>
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
