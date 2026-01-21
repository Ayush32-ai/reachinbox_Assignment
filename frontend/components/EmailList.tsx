'use client';

import { MoreVertical } from 'lucide-react';

interface EmailItem {
  id: string;
  to: string;
  subject: string;
  preview: string;
  scheduledTime?: string;
}

interface EmailListProps {
  emails: EmailItem[];
  onEmailClick: (email: EmailItem) => void;
}

export default function EmailList({ emails, onEmailClick }: EmailListProps) {
  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No emails found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => onEmailClick(email)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">To: {email.to}</p>
                    <div className="flex items-center gap-2 mb-2">
                      {email.scheduledTime && (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          {email.scheduledTime}
                        </span>
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {email.subject}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {email.preview}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
