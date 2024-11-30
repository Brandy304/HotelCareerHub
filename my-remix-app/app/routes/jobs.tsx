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
  description: string;
  requirements: string[];
  status: "active" | "closed";
  createdAt: string;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requirements: "",
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:3000/jobs", {
        withCredentials: true,
      });
      setJobs(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/login");
      }
      setError(err.response?.data?.error || "Failed to fetch jobs");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (
        !formData.title ||
        !formData.company ||
        !formData.location ||
        !formData.salaryMin ||
        !formData.salaryMax ||
        !formData.description
      ) {
        setError("Please fill in all required fields");
        return;
      }

      const jobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        salary: {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax),
        },
        description: formData.description,
        requirements: formData.requirements.split("\n").filter(Boolean),
        status: "active",
      };

      if (editingJob) {
        await axios.put(
          `http://localhost:3000/jobs/${editingJob._id}`,
          jobData,
          { withCredentials: true }
        );
      } else {
        await axios.post("http://localhost:3000/jobs", jobData, {
          withCredentials: true,
        });
      }

      setIsModalOpen(false);
      setEditingJob(null);
      resetForm();
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || "操作失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      await axios.delete(`http://localhost:3000/jobs/${id}`, {
        withCredentials: true,
      });
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || "删除失败");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      salaryMin: "",
      salaryMax: "",
      description: "",
      requirements: "",
    });
  };

  const handleStatusChange = async (
    jobId: string,
    newStatus: "active" | "closed"
  ) => {
    try {
      await axios.patch(
        `http://localhost:3000/jobs/${jobId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchJobs(); // 重新获取职位列表
    } catch (err: any) {
      setError(err.response?.data?.error || "状态更新失败");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部标题栏 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HotelCareerHub</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage all your job postings
            </p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setEditingJob(null);
              resetForm();
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Post New Job
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-8 rounded-md bg-red-50 p-4 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 职位列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {job.title}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <select
                      value={job.status}
                      onChange={(e) =>
                        handleStatusChange(
                          job._id,
                          e.target.value as "active" | "closed"
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer ${
                        job.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <p>{job.company}</p>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p>{job.location}</p>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-indigo-600 font-medium">
                      {job.salary.min / 1000}k - {job.salary.max / 1000}k
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setEditingJob(job);
                      setFormData({
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        salaryMin: job.salary.min.toString(),
                        salaryMax: job.salary.max.toString(),
                        description: job.description,
                        requirements: job.requirements.join("\n"),
                      });
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm transition-colors duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="text-red-600 hover:text-red-900 font-medium text-sm transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 模态框 */}
        {isModalOpen && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => setIsModalOpen(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">关闭</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {editingJob ? "Edit Job" : "Post New Job"}
                    </h3>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Job Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="e.g., Senior Frontend Engineer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Company <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                company: e.target.value,
                              })
                            }
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="e.g., Google Inc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="e.g., San Francisco, CA"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Minimum Salary (K/Month){" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={formData.salaryMin}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  salaryMin: e.target.value,
                                })
                              }
                              required
                              min="0"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="e.g., 15"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Maximum Salary (K/Month){" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={formData.salaryMax}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  salaryMax: e.target.value,
                                })
                              }
                              required
                              min="0"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="e.g., 25"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Job Description{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            required
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Please describe the job responsibilities and requirements..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Requirements
                          </label>
                          <textarea
                            value={formData.requirements}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requirements: e.target.value,
                              })
                            }
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="One requirement per line, e.g.:
- 3+ years of frontend development experience
- Proficient in React, Vue, and other modern frameworks
- Strong teamwork and communication skills"
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-6">
                          <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                          >
                            {editingJob ? "Save Changes" : "Post Job"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
