"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState("Private");

  const [processingFileId, setProcessingFileId] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    (async () => {
      setLoading(true);
      const token = localStorage.getItem("agenticaAccessToken");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const resUser = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/`,
          { headers }
        );
        if (!resUser.ok) throw new Error("Failed to load user data");
        const userJson = await resUser.json();
        setUserData(userJson);

        const resFiles = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/files/`,
          { headers }
        );
        if (!resFiles.ok) throw new Error("Failed to load files");
        const filesJson = await resFiles.json();
        setFiles(filesJson);
      } catch (e) {
        console.error(e);
        setError(e.message);
        if (e.message.includes("user data")) logout();
      } finally {
        setLoading(false);
      }
    })();
  }, [user, router, logout]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("information_type", fileType);

    const token = localStorage.getItem("agenticaAccessToken");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/files/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const newFile = await res.json();
      setFiles([newFile, ...files]);
      setSelectedFile(null); // Clear after upload
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const processFile = async (id) => {
    const token = localStorage.getItem("agenticaAccessToken");
    setProcessingFileId(id);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/files/${id}/process/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updated = files.map((f) =>
        f.id === id ? { ...f, status: "Processed" } : f
      );
      setFiles(updated);
    } catch (err) {
      console.error("Processing failed", err);
    } finally {
      setProcessingFileId(null);
    }
  };

  const deleteFile = async (id) => {
    const token = localStorage.getItem("agenticaAccessToken");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/files/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(files.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error && !userData) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  const profile = userData.profile || {};
  const completeness = Math.floor(
    (((profile.address ? 1 : 0) +
      (profile.phone ? 1 : 0) +
      (profile.photo ? 1 : 0)) /
      3) *
      100
  );
  const totalFiles = files.length;
  const processedFiles = files.filter((f) => f.status === "Processed").length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back,{" "}
          <span className="text-blue-600">{userData.username}</span>!
        </h1>
      </div>

      {/* Profile Card + Stats */}
      <div className="bg-white shadow rounded-lg p-6 mb-10 flex flex-col md:flex-row md:items-center md:space-x-6">
        <div className="flex-shrink-0 mb-4 md:mb-0">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-600"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-blue-600">
              <FiUser size={40} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 text-gray-700">
          {profile.address && (
            <div className="flex items-center">
              <FiMapPin className="mr-2" />
              <span>{profile.address}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center">
              <FiPhone className="mr-2" />
              <span>{profile.phone}</span>
            </div>
          )}

          {/* Embedded Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <StatCard
              label="Profile Completeness"
              value={`${completeness}%`}
              icon={FiUser}
            />
            <StatCard
              label="Uploaded Files"
              value={totalFiles}
              icon={FiFileText}
            />
            <StatCard
              label="Processed Files"
              value={processedFiles}
              icon={FiCheckCircle}
            />
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-10 bg-white shadow rounded p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Upload a New File
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            id="file-upload"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full sm:w-auto border border-gray-300 p-2 rounded focus:outline-none"
          />

          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="w-full sm:w-40 border border-gray-300 p-2 rounded focus:outline-none"
          >
            <option value="Private">Private</option>
            <option value="Public">Public</option>
          </select>

          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || uploading}
            className={`px-4 py-2 rounded text-white ${
              uploading || !selectedFile
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Files Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Filename</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Uploaded</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-t">
                <td className="p-3">{file.filename}</td>
                <td className="p-3">{file.status}</td>
                <td className="p-3">{file.information_type}</td>
                <td className="p-3">
                  {new Date(file.uploaded_at).toLocaleString()}
                </td>
                <td className="p-3 flex gap-2">
                  {file.status !== "Processed" && (
                    <button
                      onClick={() => processFile(file.id)}
                      disabled={processingFileId === file.id}
                      className={`text-sm py-1 px-2 rounded text-white flex items-center gap-1 ${
                        processingFileId === file.id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {processingFileId === file.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Process"
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => deleteFile(file.id)}
                    className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ⬇️ Helper stat card component
function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center bg-blue-50 p-4 rounded shadow-sm">
      <div className="p-2 bg-white rounded-full mr-4">
        <Icon className="text-blue-600" size={20} />
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
        <p className="text-gray-600 text-sm">{label}</p>
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
