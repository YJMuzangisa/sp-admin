'use client';

import React, { Suspense, useEffect } from 'react';
import { useLogin } from "@/hooks/useLogin";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

const LoginForm = dynamic(() => import('@/components/auth/login-form'), {
  ssr: false
});

function LoginContent() {
  const { error, loading, handleSubmit } = useLogin();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-white to-gray-50 px-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">SalesPath</span>
              <span className="block text-xs text-gray-500 -mt-0.5">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 rounded-2xl px-8 py-8 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to access the admin dashboard</p>
          </div>
          <LoginForm
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          &copy; {new Date().getFullYear()} SalesPath. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}