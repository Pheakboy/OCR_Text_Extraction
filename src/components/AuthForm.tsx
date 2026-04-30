import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Mail, Lock, LogIn, UserPlus, ScanText, Sparkles } from "lucide-react";

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-100/50 via-slate-50 to-slate-50 dark:from-teal-500/12 dark:via-slate-950 dark:to-slate-950 transition-colors duration-300" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-100/50 via-transparent to-transparent dark:from-cyan-500/10 transition-colors duration-300" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-7">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 mb-4 shadow-lg shadow-teal-500/20">
            <ScanText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2 transition-colors duration-300">
            OCR Extractor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm transition-colors duration-300">
            {isSignUp
              ? "Create an account to save and manage OCR results."
              : "Sign in to extract and save text from images."}
          </p>
        </div>

        <div className="relative">
          <form
            onSubmit={handleSubmit}
            className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800/70 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300"
          >
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1 transition-colors duration-300">
              {isSignUp ? "Create account" : "Welcome back"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 transition-colors duration-300">
              {isSignUp
                ? "Use your email to start extracting text."
                : "Use your email to continue."}
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors duration-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all shadow-sm dark:shadow-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors duration-300" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all shadow-sm dark:shadow-none"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm shadow-sm dark:shadow-none transition-colors duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-100 dark:disabled:from-slate-800 disabled:to-slate-100 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border-slate-200 dark:disabled:border-slate-800 border dark:border-0 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md dark:shadow-lg shadow-teal-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {isSignUp ? "Create Account" : "Sign In"}
                </>
              )}
            </button>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 transition-colors underline-offset-4 hover:underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
