'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import { addDays } from 'date-fns';
import { 
  ArrowLeft, 
  Pencil, 
  Paperclip, 
  Send,
  Upload,
  X,
  Plus
} from 'lucide-react';
import { apiClient, ScheduleEmailRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import 'react-datepicker/dist/react-datepicker.css';

interface ComposeEmailProps {
  onClose: () => void;
}

export default function ComposeEmail({ onClose }: ComposeEmailProps) {
  const router = useRouter();
  const { user } = useUser();
  
  // Initialize with logged-in user's email
  const [from, setFrom] = useState(user?.email || '');
  const [fromName, setFromName] = useState(user?.name || '');
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [delay, setDelay] = useState('30');
  const [hourlyLimit, setHourlyLimit] = useState('30');
  const [content, setContent] = useState('');
  const [showSendLater, setShowSendLater] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newRecipient, setNewRecipient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientFile, setRecipientFile] = useState<File | null>(null);

  // Update from email when user changes
  useEffect(() => {
    if (user) {
      setFrom(user.email);
      setFromName(user.name);
    }
  }, [user]);

  // Keep the editor simple for now: a plain textarea avoids runtime issues
  // with third-party rich text editors and React 19's removal of legacy APIs.

  const tomorrow = addDays(new Date(), 1);

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !to.includes(newRecipient.trim())) {
      setTo([...to, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setTo(to.filter((e) => e !== email));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecipientFile(file);
      // Optionally parse and add emails from file
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const emails = text
          .split(/[\r\n,;]/)
          .map((line) => line.trim())
          .filter((line) => line && line.includes('@'));
        setTo([...to, ...emails]);
      };
      reader.readAsText(file);
    }
  };

  const handleSend = async () => {
    if (!selectedDate) {
      setError('Please select a date and time to schedule');
      setShowSendLater(true);
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    if (!content.trim()) {
      setError('Email body is required');
      return;
    }

    if (to.length === 0 && !recipientFile) {
      setError('Please add at least one recipient');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scheduleData: Omit<ScheduleEmailRequest, 'recipients'> = {
        subject,
        body: content,
        startTime: selectedDate,
        delaySeconds: parseInt(delay) || 30,
        hourlyLimit: parseInt(hourlyLimit) || 30,
        senderEmail: from,
        senderName: fromName,
      };

      let result;
      if (recipientFile) {
        result = await apiClient.uploadRecipientsList(recipientFile, scheduleData);
      } else {
        result = await apiClient.scheduleEmail({
          ...scheduleData,
          recipients: to,
        });
      }

      console.log('Email scheduled successfully:', result);
      onClose();
    } catch (err: any) {
      console.error('Error scheduling email:', err);
      setError(err.message || 'Failed to schedule email. Make sure backend is running and authenticated.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendLater = () => {
    if (!selectedDate) {
      setError('Please select a date and time');
      return;
    }
    handleSend();
  };

  const handleDone = () => {
    handleSendLater();
  };

  // Generate predefined times at 5-minute intervals starting from now + 5 minutes, up to 3 hours ahead
  const generatePredefinedTimes = () => {
    const now = new Date();
    const times = [];
    
    // Start from 5 minutes from now, generate times at 5-minute intervals for the next 3 hours
    for (let i = 5; i <= 180; i += 5) {
      const time = new Date(now.getTime() + i * 60 * 1000);
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const label = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
      times.push({ label, date: time });
    }
    
    return times;
  };

  const predefinedTimes = generatePredefinedTimes();

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Compose New Email</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Pencil className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowSendLater(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Send Later
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Email Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-4">
          {/* From */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-20">From:</label>
            <input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="your.email@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To */}
          <div className="flex items-start gap-4">
            <label className="text-sm font-medium text-gray-700 w-20 pt-2">To:</label>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {to.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {email}
                    <button
                      onClick={() => handleRemoveRecipient(email)}
                      className="hover:text-green-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                  placeholder="Add recipient"
                  className="flex-1 min-w-[200px] px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddRecipient}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <label className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload List</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {recipientFile && (
                <p className="text-xs text-gray-500 mt-1">File: {recipientFile.name}</p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-20">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Delay Settings */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-32">Delay between emails:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
            <label className="text-sm font-medium text-gray-700 ml-4">Hourly Limit:</label>
            <input
              type="number"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email Body Editor */}
          <div className="mt-6">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type Your Reply..."
                className="w-full min-h-[200px] p-3 bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Send Later Modal */}
      {showSendLater && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mt-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Send Later</h3>
            
            {/* Date/Time Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date & Time
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  setSelectedDate(date);
                  setError(null);
                }}
                showTimeSelect
                timeIntervals={60}
                dateFormat="MMM d, yyyy & h:mmaa"
                minDate={new Date()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date and time"
              />
            </div>

            {/* Predefined Times */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Select</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {predefinedTimes.map((time) => (
                  <button
                    key={time.label}
                    onClick={() => {
                      setSelectedDate(time.date);
                      setError(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      selectedDate?.getTime() === time.date.getTime()
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSendLater(false);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                disabled={!selectedDate || isSubmitting}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Scheduling...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
