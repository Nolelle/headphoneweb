import React, { useEffect, useState } from "react";

type Message = {
  message_id: number;
  name: string;
  email: string;
  message: string;
  message_date: string;
  status: "READ" | "UNREAD";
};

const AdminDashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/admin/messages");
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    try {
      const res = await fetch(
        `/api/admin/messages/${selectedMessage.message_id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response })
        }
      );

      if (!res.ok) throw new Error("Failed to send response");

      await fetchMessages();
      setResponse("");
      setSelectedMessage(null);
    } catch (err) {
      setError("Failed to send response");
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Messages List */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Contact Messages</h2>
              <div className="divider"></div>
              {messages.length === 0 ? (
                <div className="alert alert-info">No messages found</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.message_id}
                    onClick={() => handleSelectMessage(message)}
                    className={`card bg-base-100 shadow-sm hover:shadow-md cursor-pointer mb-4 ${
                      selectedMessage?.message_id === message.message_id
                        ? "border-2 border-primary"
                        : "border"
                    }`}
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{message.name}</h3>
                          <p className="text-sm opacity-70">{message.email}</p>
                        </div>
                        <div
                          className={`badge ${
                            message.status === "UNREAD"
                              ? "badge-primary"
                              : "badge-ghost"
                          }`}
                        >
                          {message.status}
                        </div>
                      </div>
                      <p className="text-sm mt-2">{message.message}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(message.message_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Detail & Response */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {selectedMessage ? (
                <>
                  <h2 className="card-title">Message Detail</h2>
                  <div className="divider"></div>
                  <div className="mb-4">
                    <h3 className="font-bold">{selectedMessage.name}</h3>
                    <p className="text-sm opacity-70">{selectedMessage.email}</p>
                    <p className="mt-4">{selectedMessage.message}</p>
                  </div>
                  <form onSubmit={handleResponse}>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Your Response</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        required
                      />
                    </div>
                    <div className="card-actions justify-end mt-4">
                      <button type="submit" className="btn btn-primary">
                        Send Response
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center opacity-50 py-8">
                  Select a message to view details and respond
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;