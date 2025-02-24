"use client"
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"
import { Label } from "../ui/label";
import { CheckCircle2, ChevronUp } from "lucide-react";

const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = {
      name: (form.elements.namedItem("name") as HTMLInputElement)?.value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement)?.value.trim(),
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)?.value.trim(),
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
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        setShowModal(true);
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
      setShowScrollToTop(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="bg-[hsl(0_0%_3.9%)] text-[hsl(0_0%_98%)]">
      <div className="py-8 lg:py-20 px-4 mx-auto max-w-screen-md">
        <h2 className="mb-4 text-4xl font-extrabold text-center text-[hsl(0_0%_98%)]">
          Contact Us
        </h2>
        <p className="mb-8 lg:mb-16 text-center text-[hsl(0_0%_63.9%)] text-lg">
          Have questions about our products? Whether you&apos;re seeking technical
          details, exploring features, or interested in learning more about our
          solutions, we&apos;re here to help.
        </p>

        <form className="space-y-8" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[hsl(0_0%_98%)]">
              Your name
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="John Doe"
              required
              minLength={2}
              className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[hsl(0_0%_98%)]">
              Your email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              required
              className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-[hsl(0_0%_98%)]">
              Your message
            </Label>
            <Textarea
              id="message"
              name="message"
              rows={6}
              placeholder="Leave a message..."
              required
              minLength={10}
              className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
            />
          </div>

          <div className="space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-[hsl(220_70%_50%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(220_70%_45%)]"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send message"}
            </Button>

            {status === "error" && (
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage || "Failed to send message"}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </form>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-[hsl(0_0%_3.9%)] text-[hsl(0_0%_98%)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-[hsl(220_70%_50%)]" />
                Message Sent Successfully!
              </DialogTitle>
              <DialogDescription className="text-[hsl(0_0%_63.9%)]">
                Thank you for contacting us! We&apos;ll get back to you as soon as
                possible.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {showScrollToTop && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="fixed bottom-4 right-4 z-50 rounded-full bg-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(0_0%_83.1%)] hover:text-[hsl(0_0%_3.9%)]"
                  onClick={scrollToTop}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <p>Scroll to top</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </section>
  );
};

export default ContactForm;
