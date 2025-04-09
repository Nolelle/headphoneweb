"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
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
import { debounce } from "lodash";

// Define types for message data structure
interface Message {
  message_id: number;
  name: string;
  email: string;
  message: string;
  message_date: string;
  status: "UNREAD" | "READ" | "RESPONDED";
  admin_response?: string;
  responded_at?: string;
}

// Create an isolated text area component to prevent re-renders of the entire form
const OptimizedTextarea = memo(
  ({
    value,
    onChange,
    disabled
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    disabled: boolean;
  }) => {
    return (
      <Textarea
        placeholder="Type your response..."
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="min-h-[100px] bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
        data-testid="response-textarea"
      />
    );
  }
);

OptimizedTextarea.displayName = "OptimizedTextarea";

// Create a memoized MessageResponseForm component to prevent unnecessary re-renders
const MessageResponseForm = memo(
  ({
    messageId,
    value,
    onChange,
    onSubmit,
    isLoading
  }: {
    messageId: number;
    value: string;
    onChange: (messageId: number, value: string) => void;
    onSubmit: (messageId: number) => void;
    isLoading: boolean;
  }) => {
    // Local state for immediate UI feedback
    const [localValue, setLocalValue] = useState(value);

    // Create a stable debounced function reference that won't change between renders
    const debouncedOnChange = useMemo(
      () => debounce((val: string) => onChange(messageId, val), 300),
      [messageId, onChange]
    );

    // Cleanup the debounced function on unmount
    useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);

    // Update local value when parent value changes, but only if they differ
    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        // Update local state immediately for responsive UI
        setLocalValue(newValue);
        // Send changes to parent via debounced function
        debouncedOnChange(newValue);
      },
      [debouncedOnChange]
    );

    return (
      <div
        className="space-y-3"
        data-testid="response-form"
      >
        <OptimizedTextarea
          value={localValue}
          onChange={handleChange}
          disabled={isLoading}
        />
        <Button
          onClick={() => onSubmit(messageId)}
          disabled={isLoading || !localValue?.trim()}
          className="bg-[hsl(220_70%_50%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(220_70%_45%)] w-full sm:w-auto"
          data-testid="send-response-button"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
              Sending...
            </div>
          ) : (
            "Send Response"
          )}
        </Button>
      </div>
    );
  }
);

// Add display name for debugging
MessageResponseForm.displayName = "MessageResponseForm";

// Create a memoized MessageCard component with custom equality check
const MessageCard = memo(
  ({
    message,
    onToggleReadStatus,
    onSendResponse,
    responseValue,
    onResponseChange,
    isLoading,
    formatDate,
    getStatusColor
  }: {
    message: Message;
    onToggleReadStatus: (id: number, status: Message["status"]) => void;
    onSendResponse: (id: number) => void;
    responseValue: string;
    onResponseChange: (id: number, value: string) => void;
    isLoading: boolean;
    formatDate: (date: string) => string;
    getStatusColor: (status: Message["status"]) => string;
  }) => {
    return (
      <Card
        className="bg-[hsl(0_0%_9%)] border-[hsl(0_0%_14.9%)]"
        data-testid={`message-card-${message.message_id}`}
        data-email={message.email}
      >
        <CardContent
          className="pt-6 p-6"
          data-testid="message-content"
        >
          <div className="space-y-4">
            {/* Message Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[hsl(0_0%_98%)]">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span
                    className="font-medium break-all"
                    data-testid="message-email"
                  >
                    {message.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(0_0%_63.9%)]">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDate(message.message_date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1 transition-colors duration-200 ${getStatusColor(
                    message.status
                  )}`}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent flex-shrink-0" />
                  ) : message.status === "UNREAD" ? (
                    <Circle className="h-4 w-4 fill-current flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  )}
                  {message.status}
                </span>
                {message.status !== "RESPONDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onToggleReadStatus(message.message_id, message.status)
                    }
                    disabled={isLoading}
                    className={`bg-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(0_0%_9%)] border-[hsl(0_0%_14.9%)] min-h-9 text-xs sm:text-sm transition-opacity duration-200 ${
                      isLoading ? "opacity-70" : "opacity-100"
                    }`}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
                    ) : message.status === "UNREAD" ? (
                      "Mark as Read"
                    ) : (
                      "Mark as Unread"
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-[hsl(0_0%_14.9%)] p-4 rounded-lg text-[hsl(0_0%_98%)]">
              <p className="whitespace-pre-wrap break-words">
                {message.message}
              </p>
            </div>

            {/* Response Section */}
            {message.status !== "RESPONDED" && (
              <MessageResponseForm
                messageId={message.message_id}
                value={responseValue || ""}
                onChange={onResponseChange}
                onSubmit={onSendResponse}
                isLoading={isLoading}
              />
            )}

            {/* Previous Response */}
            {message.admin_response && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[hsl(0_0%_98%)]">
                  Previous Response:
                </p>
                <div className="bg-[hsl(0_0%_14.9%)] p-4 rounded-lg">
                  <p className="whitespace-pre-wrap break-words text-[hsl(0_0%_98%)]">
                    {message.admin_response}
                  </p>
                  <p className="text-sm text-[hsl(0_0%_63.9%)] mt-2">
                    Sent on {formatDate(message.responded_at!)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.message.message_id === nextProps.message.message_id &&
      prevProps.message.status === nextProps.message.status &&
      prevProps.responseValue === nextProps.responseValue &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.message.admin_response === nextProps.message.admin_response
    );
  }
);

// Add display name for debugging
MessageCard.displayName = "MessageCard";

export default function AdminDashboard() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [loadingItems, setLoadingItems] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Function to fetch all messages from the API
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/messages");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.error("Error:", error);
      }
      toast.error("Failed to load messages");
    }
  }, []);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle admin logout
  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Use window.location.href instead of router.replace to force a full page reload
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Error:", error);
      toast.error("Logout failed");
    }
  }, []);

  // Update the handleToggleReadStatus function to be memoized
  const handleToggleReadStatus = useCallback(
    async (messageId: number, currentStatus: Message["status"]) => {
      try {
        // Set loading state for this specific message
        setLoadingItems((prev) => ({ ...prev, [messageId]: true }));

        // Determine the new status
        const newStatus = currentStatus === "UNREAD" ? "READ" : "UNREAD";

        // Optimistic UI update - update state immediately before API call completes
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === messageId ? { ...msg, status: newStatus } : msg
          )
        );

        if (process.env.NODE_ENV !== "test") {
          console.log(
            "Updating message status:",
            messageId,
            "New status:",
            newStatus
          );
        }

        const response = await fetch(
          `/api/admin/messages/${messageId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
          }
        );

        if (process.env.NODE_ENV !== "test") {
          console.log("Response status:", response.status);
        }

        if (!response.ok) {
          const errorData = await response.json();
          // Revert the optimistic update if API call fails
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === messageId
                ? { ...msg, status: currentStatus }
                : msg
            )
          );
          throw new Error(errorData.error || "Failed to update status");
        }

        const data = await response.json();
        if (process.env.NODE_ENV !== "test") {
          console.log("Response data:", data);
        }

        // API call succeeded, toast notification
        toast.success(`Message marked as ${newStatus.toLowerCase()}`);
      } catch (error) {
        if (process.env.NODE_ENV !== "test") {
          console.error("Error:", error);
        }
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update message status"
        );
      } finally {
        // Clear loading state for this message
        setLoadingItems((prev) => ({ ...prev, [messageId]: false }));
      }
    },
    []
  );

  // Optimize textarea change handler to prevent excessive re-renders
  const handleResponseChange = useCallback(
    (messageId: number, value: string) => {
      // Use functional update to prevent stale state issues
      setResponses((prev) => {
        // Only update if the value has actually changed
        if (prev[messageId] === value) return prev;

        // Create a new object to trigger a render only for the component that needs it
        return {
          ...prev,
          [messageId]: value
        };
      });
    },
    []
  );

  // Handle sending responses to messages
  const handleSendResponse = useCallback(
    async (messageId: number) => {
      try {
        setLoadingItems((prev) => ({ ...prev, [messageId]: true }));

        const response = await fetch(
          `/api/admin/messages/${messageId}/respond`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ response: responses[messageId] })
          }
        );

        // Reset response value after sending
        if (response.ok) {
          // Parse the response data
          const data = await response.json();

          // Update local state with the new response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === messageId
                ? {
                    ...msg,
                    admin_response: responses[messageId],
                    status: "RESPONDED",
                    responded_at: new Date().toISOString()
                  }
                : msg
            )
          );

          // Clear the response field
          setResponses((prev) => ({ ...prev, [messageId]: "" }));

          // Show success toast with email preview link if available
          if (data.emailId) {
            toast.success(
              <div>
                Response sent successfully!
                <a
                  href={`https://resend.com/emails/${data.emailId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-400 mt-2"
                >
                  View email preview <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            );
          } else {
            toast.success("Response sent successfully!");
          }

          // Reload messages instead of updating local state to ensure consistency
          fetchMessages();
        } else {
          if (process.env.NODE_ENV !== "test") {
            console.error("Response error:", response.statusText);
          }
          toast.error("Failed to send response");
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "test") {
          console.error("Error:", error);
        }
        toast.error(
          error instanceof Error ? error.message : "Failed to send response"
        );
      } finally {
        setLoadingItems((prev) => ({ ...prev, [messageId]: false }));
      }
    },
    [responses, fetchMessages]
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color based on message status
  const getStatusColor = (status: Message["status"]) => {
    switch (status) {
      case "UNREAD":
        return "text-[hsl(220_70%_50%)]";
      case "READ":
        return "text-[hsl(45_93%_47%)]";
      case "RESPONDED":
        return "text-[hsl(142_76%_36%)]";
      default:
        return "text-[hsl(0_0%_63.9%)]";
    }
  };

  // Return updated JSX using the memoized components
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(0_0%_98%)]">
          Admin Dashboard
        </h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(0_0%_9%)] hover:text-[hsl(0_0%_98%)] border-[hsl(0_0%_14.9%)] w-full sm:w-auto"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Messages Card */}
      <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-[hsl(0_0%_98%)]">
            <MessageCircle className="h-5 w-5 flex-shrink-0" />
            Contact Messages
          </CardTitle>
          <CardDescription className="text-[hsl(0_0%_63.9%)]">
            Manage and respond to customer inquiries
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          <div className="space-y-6">
            {/* Virtualize the rendering for better performance with large lists */}
            {useMemo(
              () =>
                messages.map((message) => (
                  <MessageCard
                    key={message.message_id}
                    message={message}
                    onToggleReadStatus={handleToggleReadStatus}
                    onSendResponse={handleSendResponse}
                    responseValue={responses[message.message_id] || ""}
                    onResponseChange={handleResponseChange}
                    isLoading={loadingItems[message.message_id] || false}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                )),
              [
                messages,
                responses,
                loadingItems,
                handleToggleReadStatus,
                handleSendResponse,
                handleResponseChange,
                formatDate,
                getStatusColor
              ]
            )}

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
