'use client';

import { Star, MoreVertical, Minimize2, Maximize2, X } from 'lucide-react';

interface EmailViewProps {
  email: {
    from: string;
    fromEmail: string;
    subject: string;
    date: string;
    body: string;
    attachments?: Array<{ name: string; size: string; url: string }>;
  };
  onClose: () => void;
}

export default function EmailView({ email, onClose }: EmailViewProps) {
  return (
    <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
      {/* Email Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-4">
          {email.subject}
        </h2>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Star className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Minimize2 className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Maximize2 className="w-5 h-5 text-gray-400" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-300 ml-2"></div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{email.from}</span>
          </div>
          <p className="text-sm text-gray-500 mb-2">{email.fromEmail}</p>
          <p className="text-sm text-gray-500">{email.date}</p>
        </div>

        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6 space-y-2">
            {email.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">IMG</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                  <p className="text-xs text-gray-500">{attachment.size}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
