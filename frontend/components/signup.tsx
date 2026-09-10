"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignup } from "@/backend/query";
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle, Sparkles, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const signupMutation = useSignup();

  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setLocalError("Please fill in all fields.");
      return false;
    }
    if (form.name.trim().length < 2) {
      setLocalError("Name must be at least 2 characters.");
      return false;
    }
    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(form.email)) {
      setLocalError("Please enter a valid email address.");
      return false;
    }
    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return false;
    }
    setLocalError("");
    return true;
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    signupMutation.mutate(form, {
      onSuccess: (e) => {
        router.push("/main");
        localStorage.setItem("token", e?.data?.token);
      },
      onError: (err) => {
        //@ts-ignore
        setLocalError(err?.response?.data?.e)
        console.error("Signup error:", err);
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md p-4 relative z-10 my-8">
        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-8 h-8 text-pink-400" />
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2 tracking-tight">
              Join Orbit
            </h1>
            <p className="text-slate-400 text-sm font-medium">Create an account to start building.</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pink-400 text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 outline-none hover:border-slate-600"
                  placeholder="John Doe"
                  aria-label="Name"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pink-400 text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 outline-none hover:border-slate-600"
                  placeholder="name@orbit.dev"
                  aria-label="Email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pink-400 text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 outline-none hover:border-slate-600"
                  placeholder="••••••••"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-pink-400 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Messages */}
            {(localError || signupMutation.isError) && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300" role="alert">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm font-medium leading-relaxed">
                  {localError || "Signup failed. Please try again."}
                </p>
              </div>
            )}

            {/* Success Message */}
            {signupMutation.isSuccess && (
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300" role="alert">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-emerald-400 text-sm font-medium leading-relaxed">
                  Welcome aboard! Redirecting you...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={signupMutation.isPending || signupMutation.isSuccess}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-lg shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {signupMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : signupMutation.isSuccess ? (
                "Success!"
              ) : (
                <>
                  Create Account
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-pink-400 hover:text-pink-300 transition-colors ml-1"
            >
              Log in instead
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}