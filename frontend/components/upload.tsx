import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload as UploadIcon } from "lucide-react";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<"users" | "device" | "">("");
  const [loading, setLoading] = useState(false);
  const [anomalousUsers, setAnomalousUsers] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !category) {
      alert("Please select a file and category before uploading.");
      return;
    }

    try {
      setLoading(true);
      const endpoint =
        category === "users"
          ? "http://127.0.0.1:8000/predict_autoencoder"
          : "http://127.0.0.1:8000/analyze";

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(endpoint, { method: "POST", body: formData });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data = await res.json();
      setAnomalousUsers(data.top_anomalous_users || []);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-700">
          <UploadIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-semibold">Upload CSV</h1>
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-700 dark:text-slate-300 
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50"
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Category
          </span>
          <div className="flex gap-4">
            {["users", "device"].map((type) => (
              <label
                key={type}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition
                  ${
                    category === type
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
              >
                <input
                  type="radio"
                  value={type}
                  checked={category === type}
                  onChange={() =>
                    setCategory(type as "users" | "device")
                  }
                  className="accent-blue-600"
                />
                <Badge
                  variant="outline"
                  className={
                    type === "users"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              </label>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleSubmit}
          variant="default"
          disabled={!file || !category || loading}
          className="w-fit"
        >
          <UploadIcon className="h-4 w-4 mr-2" />
          {loading ? "Uploading..." : "Upload"}
        </Button>

        {/* Debug Info */}
        {file && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Selected file:</span> {file.name}
            <span className="ml-4 font-medium">Category:</span>{" "}
            {category || "None"}
          </div>
        )}
      </div>

      {/* Anomalous Users Table */}
      {anomalousUsers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">
            Top Anomalous LogOn
          </h2>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                <tr>
                  {[
                    "User",
                    "Login Count",
                    "Unique PCs",
                    "Mean Time Diff",
                    "Std Time Diff",
                    "Reconstruction Error",
                    "Reasons",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalousUsers.map((user, idx) => (
                  <tr
                    key={user.user || idx}
                    className={`border-t border-slate-200 dark:border-slate-700 
                      ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}
                      hover:bg-blue-50 dark:hover:bg-blue-900/20 transition`}
                  >
                    <td className="px-4 py-2">{user.user}</td>
                    <td className="px-4 py-2">{user.login_count}</td>
                    <td className="px-4 py-2">{user.unique_pc_count}</td>
                    <td className="px-4 py-2">{user.mean_time_diff?.toFixed(2)}</td>
                    <td className="px-4 py-2">{user.std_time_diff?.toFixed(2)}</td>
                    <td className="px-4 py-2">{user.reconstruction_error?.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <ul className="list-disc pl-5">
                        {user.reasons?.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
