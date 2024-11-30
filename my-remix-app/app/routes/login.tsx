import { useState } from "react";
import { Form } from "@remix-run/react";
import axios from "axios";

// 在文件顶部添加角色类型定义
type Role = "recruiter" | "jobseeker" | "admin";

interface RoleOption {
  value: Role;
  label: string;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  // 添加角色选项
  const roleOptions: RoleOption[] = [
    { value: "recruiter", label: "Recruiter" },
    { value: "jobseeker", label: "Job Seeker" },
    { value: "admin", label: "Administrator" },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const email = formData.get("email") as string;
    const username = email.split("@")[0];
    const password = formData.get("password") as string;
    const role = formData.get("role") as Role; // 获取角色值

    try {
      if (isLogin) {
        const response = await axios.post(
          "http://localhost:3000/users/login",
          {
            username,
            password,
            role, // 添加角色字段
          },
          {
            withCredentials: true,
          }
        );

        if (response.data.user) {
          // 登录成功
          window.location.href = "/";
        }
      } else {
        const response = await axios.post(
          "http://localhost:3000/users/register",
          {
            username,
            email,
            password,
            role, // 添加角色字段
          }
        );

        if (response.status === 201) {
          // 注册成功后自动登录
          const loginResponse = await axios.post(
            "http://localhost:3000/users/login",
            {
              username,
              password,
            },
            {
              withCredentials: true,
            }
          );

          if (loginResponse.data.user) {
            window.location.href = "/";
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Operation failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
        </div>
        <Form method="post" className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Email Address"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Password"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              ></label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Please select a role</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </Form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {isLogin
              ? "No account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
