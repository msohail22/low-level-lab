import React from "react";

export default function App() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <h1 className="text-5xl font-bold mb-4">My App</h1>
      <p className="text-slate-400 mb-8">A simple landing page</p>

      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
        Get Started
      </button>
    </div>
  );
}
