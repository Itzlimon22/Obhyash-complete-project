'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Users, FileQuestion, Flag, Upload } from 'lucide-react';
import BulkUploadDialog from '@/components/bulk-upload/bulk-upload-dialog';
import SeedDatabaseButton from '@/components/seed-database-button';

export default function AdminDashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      {/* 1. Sidebar */}
      <Sidebar />

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 ml-64 flex flex-col">
        
        {/* 3. Header */}
        <Header />

        {/* 4. Dashboard Content */}
        <div className="p-8 space-y-8">
          
          {/* Top Section: Title & Upload Button */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">A quick overview of your platform's stats.</p>
            </div>
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:bg-blue-700 transition-all font-medium"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload Questions
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Total Users */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Total Users</p>
                  <h3 className="text-3xl font-bold text-white">23</h3>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 2: Total Questions */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Total Questions</p>
                  <h3 className="text-3xl font-bold text-white">2,408</h3>
                </div>
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                  <FileQuestion className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 3: Pending Reports */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Pending Reports</p>
                  <h3 className="text-3xl font-bold text-white">0</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Flag className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Seed Database Button (Preserved functionality) */}
          <div className="mt-8">
            <SeedDatabaseButton />
          </div>

        </div>
      </main>

      {/* 5. Upload Modal Layer */}
      {showUploadModal && (
        <BulkUploadDialog
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            console.log('Upload success! Refreshing data...');
            // Add any data refresh logic here if needed
          }}
        />
      )}
    </div>
  );
}