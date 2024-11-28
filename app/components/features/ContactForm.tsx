"use client";
import React, { useEffect, useRef, useState } from "react";

const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const modalRef = useRef<HTMLDialogElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

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
        modalRef.current?.showModal();
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

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
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
              className="btn btn-primary"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send message"}
            </button>

            {status === "error" && (
              <div
                className="alert alert-error"
                role="alert"
              >
                {errorMessage || "Failed to send message"}
              </div>
            )}
          </div>
        </form>

        {/* DaisyUI Modal */}
        <dialog
          ref={modalRef}
          className="modal"
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Message Sent Successfully!
            </h3>
            <p className="py-4">
              Thank you for contacting us! We'll get back to you as soon as
              possible.
            </p>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Close</button>
              </form>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
          >
            <button>close</button>
          </form>
        </dialog>

        {showScrollToTop && (
          <button
            className="btn btn-circle btn-primary fixed bottom-4 right-4 z-50"
            onClick={scrollToTop}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
};

export default ContactForm;