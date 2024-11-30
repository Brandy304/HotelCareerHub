import { json, redirect } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const isLogin = formData.get("isLogin") === "true";

  const API_URL = process.env.API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await fetch(`${API_URL}/${isLogin ? 'login' : 'register'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return json({ error: data.message }, { status: response.status });
    }

    // 登录成功后重定向到首页或仪表板
    return redirect('/dashboard');
  } catch (error) {
    return json({ error: 'Server error' }, { status: 500 });
  }
}; 