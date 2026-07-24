import React from "react";
import { Clock, FileEdit, Download, CheckCircle } from "lucide-react";

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "edit",
      title: "Updated Software Engineer Resume",
      time: "2 hours ago",
      icon: FileEdit,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      id: 2,
      type: "download",
      title: "Downloaded PDF",
      time: "1 day ago",
      icon: Download,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      id: 3,
      type: "analysis",
      title: "ATS Score Analysis Completed",
      time: "2 days ago",
      icon: CheckCircle,
      color: "text-primary-600",
      bgColor: "bg-primary-50",
      borderColor: "border-primary-200",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-400" />
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className={`w-9 h-9 rounded-lg ${activity.bgColor} ${activity.borderColor} border flex items-center justify-center shrink-0`}>
              <activity.icon className={`w-4 h-4 ${activity.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors py-2 rounded-lg hover:bg-primary-50">
        View All Activity
      </button>
    </div>
  );
}
