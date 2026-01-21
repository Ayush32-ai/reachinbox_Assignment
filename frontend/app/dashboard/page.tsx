'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmailList from '@/components/EmailList';
import EmailView from '@/components/EmailView';
import ComposeEmail from '@/components/ComposeEmail';
import { apiClient, Email } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

type Tab = 'inbox' | 'scheduled' | 'sent';
type ViewMode = 'list' | 'email' | 'compose';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    // Only load emails if user is authenticated
    if (user) {
      loadEmails();
    }
  }, [activeTab, user]);

  // Don't render dashboard UI if user is not authenticated
  if (!user) {
    return null;
  }

  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      // Inbox should show sent messages by the current user
      if (activeTab === 'scheduled') {
        response = await apiClient.getScheduledEmails();
      } else if (activeTab === 'sent' || activeTab === 'inbox') {
        // Treat inbox as sent messages (sent messages should appear in inbox)
        response = await apiClient.getSentEmails();
      } else {
        response = { items: [] };
      }

      // Normalize server Email shape to frontend Email type and ensure we only show
      // messages that belong to the current user (extra client-side guard).
      const normalized = (response.items || []).map((e: any) => ({
        id: e.id,
        subject: e.subject,
        body: e.body,
        recipient: e.recipient,
        scheduledFor: e.scheduledAt ?? e.scheduledFor ?? null,
        sentAt: e.sentAt ?? null,
        status:
          e.status === 'SENT' || e.status === 'sent'
            ? 'sent'
            : e.status === 'FAILED' || e.status === 'failed'
            ? 'failed'
            : 'pending',
        senderEmail: e.senderEmail ?? e.from ?? null,
      }));

      const filtered = normalized.filter((e: any) => {
        // If user exists, prefer server-side scoping, but also filter client-side by senderEmail
        if (!user) return false;
        if (!e.senderEmail) return true;
        return e.senderEmail === user.email;
      });

      setEmails(filtered as Email[]);
    } catch (err: any) {
      console.error('Error loading emails:', err);
      setError(err.message || 'Failed to load emails');
      // For development, show mock data if API fails
      setEmails(getMockEmails());
    } finally {
      setLoading(false);
    }
  };

  const getMockEmails = (): Email[] => {
    if (activeTab === 'scheduled') {
      return [
        {
          id: '1',
          subject: 'Meeting follow-up - Scheduled',
          body: 'Hi John, just wanted to follow up on our meeting...',
          recipient: 'John Smith',
          scheduledFor: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          subject: "Remind, good to see you - you'll love it",
          body: 'Hi Dave, just wanted to follow up on our meeting...',
          recipient: 'Dave',
          scheduledFor: new Date().toISOString(),
          status: 'pending',
        },
      ];
    } else if (activeTab === 'sent') {
      return [
        {
          id: '3',
          subject: 'Re: Project Update - Thanks for the update, Sarah. Looks good!',
          body: 'Thanks for the update, Sarah. Looks good!',
          recipient: 'Sarah Wilson',
          sentAt: new Date().toISOString(),
          status: 'sent',
        },
        {
          id: '4',
          subject: 'Issue with login - I am having trouble logging in to the dashboard...',
          body: 'I am having trouble logging in to the dashboard...',
          recipient: 'Support',
          sentAt: new Date().toISOString(),
          status: 'sent',
        },
      ];
    }
    return [];
  };

  const handleEmailClick = (emailItem: { id: string; to: string; subject: string; preview: string; scheduledTime?: string }) => {
    // Find the full email object from the emails array
    const fullEmail = emails.find(e => e.id === emailItem.id);
    
    if (fullEmail) {
      // Create email view data from Email object
      setSelectedEmail({
        from: 'Amanda Clarke',
        fromEmail: 'amanda.clarke@example.com',
        subject: fullEmail.subject,
        date: fullEmail.sentAt
          ? new Date(fullEmail.sentAt).toLocaleString()
          : fullEmail.scheduledFor
            ? new Date(fullEmail.scheduledFor).toLocaleString()
            : new Date().toLocaleString(),
        body: `<p>${fullEmail.body.replace(/\n/g, '</p><p>')}</p>`,
        attachments: [],
      });
      setViewMode('email');
    }
  };

  const handleCompose = () => {
    setViewMode('compose');
    setSelectedEmail(null);
  };

  const handleCloseCompose = () => {
    setViewMode('list');
    setSelectedEmail(null);
    // Reload emails after composing
    loadEmails();
  };

  const handleCloseEmail = () => {
    setViewMode('list');
    setSelectedEmail(null);
  };

  // Transform Email[] to format expected by EmailList
  const emailListItems = emails.map((email) => ({
    id: email.id,
    to: email.recipient,
    subject: email.subject,
    preview: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : ''),
    scheduledTime: email.status === 'pending' && email.scheduledFor
      ? new Date(email.scheduledFor).toLocaleDateString('en-US', { 
          weekday: 'short', 
          hour: 'numeric', 
          minute: '2-digit' 
        })
      : undefined,
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onCompose={handleCompose}
      />
      {viewMode === 'list' && (
        <>
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          )}
          {error && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <p className="text-sm text-gray-500">Showing mock data for development</p>
              </div>
            </div>
          )}
          {!loading && (
            <EmailList 
              emails={emailListItems} 
              onEmailClick={handleEmailClick}
            />
          )}
        </>
      )}
      {viewMode === 'email' && selectedEmail && (
        <EmailView email={selectedEmail} onClose={handleCloseEmail} />
      )}
      {viewMode === 'compose' && (
        <ComposeEmail onClose={handleCloseCompose} />
      )}
    </div>
  );
}
