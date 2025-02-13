'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { 
  Mail, 
  Clock, 
  CheckCircle2, 
  Circle,
  MessageCircle,
  LogOut,
  ExternalLink 
} from "lucide-react";
import { toast } from "sonner";

// Define types for message data structure
interface Message {
  message_id: number;
  name: string;
  email: string;
  message: string;
  message_date: string;
  status: 'UNREAD' | 'READ' | 'RESPONDED';
  admin_response?: string;
  responded_at?: string;
}

// Interface for email response data
interface EmailResponse {
  emailId?: string;
  emailPreviewUrl?: string;
}

export default function AdminDashboard() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [loadingItems, setLoadingItems] = useState<{ [key: number]: boolean }>({});
  const router = useRouter();

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Function to fetch all messages from the API
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/admin/messages');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load messages');
    }
  };

  // Handle admin logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }

      router.push('/admin/login');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Logout failed');
    }
  };

  // Update the handleToggleReadStatus function in AdminDashboard.tsx
const handleToggleReadStatus = async (messageId: number, currentStatus: Message['status']) => {
  try {
    // Set loading state for this specific message
    setLoadingItems(prev => ({ ...prev, [messageId]: true }));
    
    // Determine the new status
    const newStatus = currentStatus === 'UNREAD' ? 'READ' : 'UNREAD';
    
    const response = await fetch(`/api/admin/messages/${messageId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update status');
    }

    const data = await response.json();
    
    // Update the messages state with the new status
    setMessages(messages.map(msg => 
      msg.message_id === messageId 
        ? { ...msg, status: newStatus, updated_at: data.updated_at }
        : msg
    ));
    
    toast.success(`Message marked as ${newStatus.toLowerCase()}`);
  } catch (error) {
    console.error('Error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update message status');
  } finally {
    // Clear loading state for this message
    setLoadingItems(prev => ({ ...prev, [messageId]: false }));
  }
};
  

  // Handle sending a response to a message
  const handleSendResponse = async (messageId: number) => {
    const response = responses[messageId];
    if (!response?.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setLoadingItems(prev => ({ ...prev, [messageId]: true }));
      
      const res = await fetch(`/api/admin/messages/${messageId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      });

      const data: Message & EmailResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send response');
      }

      // Update local state with the new response
      setMessages(messages.map(msg =>
        msg.message_id === messageId
          ? { 
              ...msg, 
              admin_response: response, 
              status: 'RESPONDED', 
              responded_at: new Date().toISOString() 
            }
          : msg
      ));
      
      // Clear the response field
      setResponses({ ...responses, [messageId]: '' });
      
      // Show success toast with email preview link if available
      if (data.emailPreviewUrl) {
        toast.success(
          <div>
            Response sent successfully!
            <a 
              href={data.emailPreviewUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-400 mt-2"
            >
              View email preview <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        );
      } else {
        toast.success('Response sent successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send response');
    } finally {
      setLoadingItems(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color based on message status
  const getStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'UNREAD':
        return 'text-[hsl(220_70%_50%)]';
      case 'READ':
        return 'text-[hsl(45_93%_47%)]';
      case 'RESPONDED':
        return 'text-[hsl(142_76%_36%)]';
      default:
        return 'text-[hsl(0_0%_63.9%)]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[hsl(0_0%_98%)]">Admin Dashboard</h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(0_0%_9%)] hover:text-[hsl(0_0%_98%)] border-[hsl(0_0%_14.9%)]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Messages Card */}
      <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-[hsl(0_0%_98%)]">
            <MessageCircle className="h-5 w-5" />
            Contact Messages
          </CardTitle>
          <CardDescription className="text-[hsl(0_0%_63.9%)]">
            Manage and respond to customer inquiries
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {messages.map((message) => (
              <Card key={message.message_id} className="bg-[hsl(0_0%_9%)] border-[hsl(0_0%_14.9%)]">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Message Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[hsl(0_0%_98%)]">
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">{message.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[hsl(0_0%_63.9%)]">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(message.message_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 ${getStatusColor(message.status)}`}>
                          {message.status === 'UNREAD' ? (
                            <Circle className="h-4 w-4 fill-current" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {message.status}
                        </span>
                        {message.status !== 'RESPONDED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleReadStatus(message.message_id, message.status)}
                            disabled={loadingItems[message.message_id]}
                            className="bg-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(0_0%_9%)] border-[hsl(0_0%_14.9%)]"
                          >
                            {loadingItems[message.message_id] ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
                            ) : (
                              message.status === 'UNREAD' ? 'Mark as Read' : 'Mark as Unread'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="bg-[hsl(0_0%_14.9%)] p-4 rounded-lg text-[hsl(0_0%_98%)]">
                      <p className="whitespace-pre-wrap">{message.message}</p>
                    </div>

                    {/* Response Section */}
                    {message.status !== 'RESPONDED' && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Type your response..."
                          value={responses[message.message_id] || ''}
                          onChange={(e) => 
                            setResponses({
                              ...responses,
                              [message.message_id]: e.target.value
                            })
                          }
                          className="min-h-[100px] bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
                        />
                        <Button
                          onClick={() => handleSendResponse(message.message_id)}
                          disabled={loadingItems[message.message_id] || !responses[message.message_id]?.trim()}
                          className="bg-[hsl(220_70%_50%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(220_70%_45%)]"
                        >
                          {loadingItems[message.message_id] ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
                              Sending...
                            </div>
                          ) : (
                            'Send Response'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Previous Response */}
                    {message.admin_response && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[hsl(0_0%_98%)]">Previous Response:</p>
                        <div className="bg-[hsl(0_0%_14.9%)] p-4 rounded-lg">
                          <p className="whitespace-pre-wrap text-[hsl(0_0%_98%)]">{message.admin_response}</p>
                          <p className="text-sm text-[hsl(0_0%_63.9%)] mt-2">
                            Sent on {formatDate(message.responded_at!)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {messages.length === 0 && (
              <div className="text-center py-6 text-[hsl(0_0%_63.9%)]">
                No messages found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}