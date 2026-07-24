import React from "react";
import { Activity, Eye, Download, Target } from "lucide-react";

export function DashboardStats() {
  const stats = [
    {
      title: "Avg ATS Score",
      value: "84/100",
      description: "Based on 3 resumes",
      icon: Activity,
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Resume Views",
      value: "142",
      description: "Last 30 days",
      icon: Eye,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Total Downloads",
      value: "28",
      description: "All time PDF exports",
      icon: Download,
      trend: "+2",
      trendUp: true,
    },
    {
      title: "Interview Prediction",
      value: "High",
      description: "Based on top resume",
      icon: Target,
      trend: "Top 15%",
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 shadow-sm">
              <stat.icon className="w-6 h-6" />
            </div>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stat.trendUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {stat.trend}
            </div>
          </div>
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{stat.title}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
          <p className="text-xs text-gray-400 mt-auto">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}
