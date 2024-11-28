"use client";

import React, { useState } from "react";

const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = {
      name: (form.elements.namedItem("name") as HTMLInputElement)?.value.trim(),
      email: (
        form.elements.namedItem("email") as HTMLInputElement
      )?.value.trim(),
      message: (
        form.elements.namedItem("message") as HTMLTextAreaElement
      )?.value.trim()
    };

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      setErrorMessage("All fields are required");
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
      } else {
        const data = await response.json();
        setStatus("error");
        setErrorMessage(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("An unexpected error occurred");
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
        <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-center text-gray-900 dark:text-white">
          Contact Us
        </h2>
        <p className="mb-8 lg:mb-16 font-light text-center text-gray-500 dark:text-gray-400 sm:text-xl">
          Have questions about our products? Whether you're seeking technical
          details, exploring features, or interested in learning more about our
          solutions, we're here to help.
        </p>
        <form
          className="space-y-8"
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <label
              htmlFor="name"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Your name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-colors"
              placeholder="John Doe"
              required
              minLength={2}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Your email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-colors"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
            >
              Your message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-y transition-colors"
              placeholder="Leave a message..."
              required
              minLength={10}
            ></textarea>
          </div>
          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center w-fit disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition-colors"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send message"}
            </button>

            {status === "success" && (
              <div
                className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400"
                role="alert"
              >
                Message sent successfully!
              </div>
            )}

            {status === "error" && (
              <div
                className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                role="alert"
              >
                {errorMessage || "Failed to send message"}
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
