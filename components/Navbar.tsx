
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ImageComp from "@/components/ImageComp";

type SearchUser = {
  id: string;
  username: string;
  displayName: string | null;
  img: string | null;
};

const Navbar = () => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced username search.
  useEffect(() => {
    const searchQuery = query.trim().replace(/^@/, "");

    if (!searchQuery) {
      setUsers([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Failed to search users");
        }

        const data = await res.json();
        setUsers(data.users);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError("Something went wrong. Please try again.");
        setUsers([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectUser = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div
      className="fixed top-0 md:left-24
      h-14 w-screen
      md:w-[calc(100vw-6rem)]
      flex items-center justify-between
      border-b border-foreground
      px-8
      bg-background
      z-40"
    >
      <Image
        src="/light-logo.svg"
        alt="Logo"
        width={100}
        height={62}
        className="dark:hidden w-25 h-15.5 cursor-pointer -z-10"
        onClick={() => router.push("/")}
      />

      <Image
        src="/dark-logo.svg"
        alt="Logo"
        width={100}
        height={62}
        className="hidden dark:block w-25 h-15.5 cursor-pointer -z-10"
        onClick={() => router.push("/")}
      />

      {/* USER SEARCH */}
      <div ref={searchRef} className="relative hidden md:block">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="Search username..."
          autoComplete="off"
          className="px-4 py-2 text-base w-72 rounded-md
          bg-background border border-foreground
          focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {isOpen && query.trim() && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute top-full right-0 mt-2 w-80
            max-h-96 overflow-y-auto rounded-xl
            border border-foreground/20 bg-background
            shadow-xl"
          >
            {loading && (
              <p className="p-4 text-sm text-center text-foreground/60">
                Searching...
              </p>
            )}

            {!loading && error && (
              <p className="p-4 text-sm text-center text-red-500">
                {error}
              </p>
            )}

            {!loading && !error && users.length === 0 && (
              <p className="p-4 text-sm text-center text-foreground/60">
                No users found.
              </p>
            )}

            {!loading &&
              !error &&
              users.map((person) => (
                <Link
                  key={person.id}
                  href={`/${person.username}`}
                  onClick={handleSelectUser}
                  className="flex items-center gap-3 p-3
                  hover:bg-foreground/5 transition"
                >
                  <ImageComp
                    src={person.img || "general/noAvatar.png"}
                    alt={person.displayName || person.username}
                    w={40}
                    h={40}
                    className="rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {person.displayName || person.username}
                    </p>
                    <p className="text-xs text-foreground/60 truncate">
                      @{person.username}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
