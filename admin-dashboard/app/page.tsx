'use client'; // 👈 IMPORTANT for Next.js

import React, { useState } from 'react';
import { Upload, LayoutDashboard } from 'lucide-react';
// ✅ FIXED: Imported the correct component name from the correct path
import BulkUploadDialog from '@/components/bulk-upload/bulk-upload-dialog';
import SeedDatabaseButton from '@/components/seed-database-button';

export default function AdminDashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard /> Admin Dashboard
          </h1>
          <p className="text-gray-500">Manage your Obyash question bank</p>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all"
        >
          <Upload className="w-5 h-5" />
          Bulk Upload Questions
        </button>
      </div>

      {/* Placeholder Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold">Total Questions</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">--</p>
        </div>
        {/* Add more cards here */}
      </div>

      {/* Modal */}
      {showUploadModal && (
        <BulkUploadDialog
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            console.log('Upload success! Refreshing data...');
            // You can add logic here later to re-fetch the 'Total Questions' count
          }}
        />
      )}

      <SeedDatabaseButton />
    </div>
  );
}
