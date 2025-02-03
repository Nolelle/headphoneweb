"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { useCart } from "../Cart/CartContext";

const Header = () => {
  const { items, total } = useCart();

  // Calculate total number of items in cart
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate cart subtotal
  const cartSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <header className="bg-[hsl(0_0%_3.9%)] border-b border-border">
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center">
          {/* Left section with logo and navigation */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/headphones_plus_icon 1.png"
                alt="Headphone Plus"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="font-semibold text-lg text-[hsl(0_0%_98%)]">
                Headphone Plus
              </span>
            </Link>

            {/* Main Navigation */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="#about" legacyBehavior passHref>
                    <NavigationMenuLink className="px-3 py-2 text-[hsl(0_0%_98%)] hover:text-[hsl(0_0%_83.1%)]">
                      About Us
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="#headphone" legacyBehavior passHref>
                    <NavigationMenuLink className="px-3 py-2 text-[hsl(0_0%_98%)] hover:text-[hsl(0_0%_83.1%)]">
                      Headphones
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="#contact" legacyBehavior passHref>
                    <NavigationMenuLink className="px-3 py-2 text-[hsl(0_0%_98%)] hover:text-[hsl(0_0%_83.1%)]">
                      Contact Us
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Cart Dropdown */}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-[hsl(0_0%_98%)] hover:text-[hsl(0_0%_83.1%)] hover:bg-[hsl(0_0%_14.9%)]"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-[hsl(220_70%_50%)] text-[hsl(0_0%_98%)]"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
                <div className="p-4">
                  <div className="flex justify-between mb-4">
                    <span className="font-semibold text-[hsl(0_0%_98%)]">
                      {cartItemCount} {cartItemCount === 1 ? "Item" : "Items"}
                    </span>
                    <span className="text-[hsl(0_0%_83.1%)]">
                      ${cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                  {items.length > 0 ? (
                    <Link href="/cart">
                      <Button className="w-full bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]">
                        View Cart
                      </Button>
                    </Link>
                  ) : (
                    <p className="text-center text-[hsl(0_0%_63.9%)]">Your cart is empty</p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;