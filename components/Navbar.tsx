import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";

import { UserButton, auth } from '@clerk/nextjs'

const Navbar = () => {
  // Replace with your auth of choice, e.g. Clerk: const { userId } = auth();
  const { userId } = auth();
  console.log(userId)
  const isUserSignedIn = false;

  return (
    <nav
      className={cn(
        "sticky h-14 inset-x-0 top-0 z-30 border-b border-gray-200  bg-white/40 backdrop-blur-lg transition-all"
      )}
    >
      <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200">
          <Link
            href="/"
            className="flex z-40 justify-center items-center gap-1"
          >
            <span className="text-2xl font-semibold">StudyAP</span>
          </Link>
          <div className="flex gap-1 sm:gap-4 items-center">
            {!isUserSignedIn ? (
              <MobileNav />
            ) : (
              <Link
                className={buttonVariants({
                  size: "sm",
                  className: "sm:hidden mr-3",
                })}
                href="/dashboard"
              >
                Dashboard
              </Link>
            )}

            <div className="hidden items-center space-x-4 sm:flex">
              {!userId ? (
                <>
                  <Link
                    href="/pricing"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    })}
                  >
                  </Link>
                  <Link
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    })}
                    href="/sign-in"
                  >
                    Sign in
                  </Link>
                  <Link
                    className={buttonVariants({
                      size: "sm",
                    })}
                    href="/sign-up"
                  >
                    Get started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    })}
                    href="/dashboard"
                  >
                    Dashboard
                  </Link>
                  <Link
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    })}
                    href="/profile"
                  >
                    Profile
                  </Link>
                </>
              )}
            </div>
            <div className="ml-auto">
            <UserButton afterSignOutUrl="/" /> 
            </div>
            {/* User profile mockup below, e.g using Clerk: <UserButton afterSignOutUrl="/" /> */}
            {isUserSignedIn && (
              <div className="bg-emerald-600 border-2 border-black shadow-lg rounded-full w-10 h-10">
                 
              </div>
            )}
          </div>
          
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
