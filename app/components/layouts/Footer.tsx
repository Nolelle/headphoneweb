import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[hsl(0_0%_3.9%)] text-[hsl(0_0%_98%)] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Image
              src="/headphones_plus_icon 1.png"
              alt="Bone+"
              width={50}
              height={50}
              className="mb-4"
            />
            <div className="space-y-2">
              <p className="font-medium">Bone+ LTD.</p>
              <p className="text-sm text-[hsl(0_0%_63.9%)]">
                The best headphones since 2024
              </p>
              <p className="text-sm text-[hsl(0_0%_63.9%)]">
                Copyright © {new Date().getFullYear()} - All rights reserved
              </p>
            </div>
            <Link
              href="/admin/login"
              className="text-sm hover:text-[hsl(0_0%_83.1%)] transition-colors"
            >
              Admin View
            </Link>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h6 className="text-lg font-semibold">Company</h6>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/#about"
                className="text-[hsl(0_0%_63.9%)] hover:text-[hsl(0_0%_83.1%)] transition-colors"
              >
                About us
              </Link>
              <Link
                href="/#contact"
                className="text-[hsl(0_0%_63.9%)] hover:text-[hsl(0_0%_83.1%)] transition-colors"
              >
                Contact
              </Link>
              <Link
                href="#jobs"
                className="text-[hsl(0_0%_63.9%)] hover:text-[hsl(0_0%_83.1%)] transition-colors"
              >
                Jobs
              </Link>
              <Link
                href="#press"
                className="text-[hsl(0_0%_63.9%)] hover:text-[hsl(0_0%_83.1%)] transition-colors"
              >
                Press kit
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h6 className="text-lg font-semibold">Legal</h6>
            <nav className="flex flex-col space-y-2">
              <Link
                href="#terms"
                className="text-[hsl(0_0%_63.9%)] hover:text-[hsl(0_0%_83.1%)] transition-colors"
              >
                Terms of use
              </Link>
              <Link
                href="#privacy"
                className="text-[hsl(0_0%_63.9%)] hover:text-[hsl(0_0%_83.1%)] transition-colors"
              >
                Privacy policy
              </Link>
              <Link
                href="#cookies"
                className="text-[hsl(0_0%_63.9%)] hover:text-[hsl(0_0%_83.1%)] transition-colors"
              >
                Cookie policy
              </Link>
            </nav>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h6 className="text-lg font-semibold">Follow Us</h6>
            <div className="flex space-x-4">
              <Link
                href="#twitter"
                className="hover:text-[hsl(0_0%_83.1%)] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </Link>
              <Link
                href="#youtube"
                className="hover:text-[hsl(0_0%_83.1%)] transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="h-6 w-6" />
              </Link>
              <Link
                href="#facebook"
                className="hover:text-[hsl(0_0%_83.1%)] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
