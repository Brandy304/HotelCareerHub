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
}

interface Application {
  _id: string;
  job: Job;
  status: "pending" | "accepted" | "rejected";
  coverLetter: string;
  createdAt: string;
}

export default function SentApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get<Application[]>(
        "http://localhost:3000/applications/sent",
        { withCredentials: true }
      );
      setApplications(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/login");
      }
      setError(err.response?.data?.error || "Failed to fetch applications");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold text-gray-900">
            Application History
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View all your job applications
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {applications.map((application) => (
            <div
              key={application._id}
              className="bg-white shadow-sm rounded-lg border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {application.job.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {application.job.company}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      application.status
                    )}`}
                  >
                    {application.status === "pending" && "Pending"}
                    {application.status === "accepted" && "Accepted"}
                    {application.status === "rejected" && "Rejected"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Location: </span>{" "}
                      {application.job.location}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Salary Range: </span>{" "}
                      {application.job.salary.min / 1000}k -{" "}
                      {application.job.salary.max / 1000}k
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Application Date: </span>{" "}
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Cover Letter:
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {application.coverLetter}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {applications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No applications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
