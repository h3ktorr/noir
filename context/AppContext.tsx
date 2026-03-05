'use client'

import { createContext, ReactNode, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

type AppContextType = {
 isCreatePostOpen: boolean;
 openCreatePost: () => void;
 closeCreatePost: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

type AppContextProviderProps = {
 children: ReactNode;
};

const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
 const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
 const pathname = usePathname();
 const router = useRouter();

 const openCreatePost = useCallback(() => {
  setIsCreatePostOpen(true);
  if (pathname !== "/compose/post") {
    // push the modal route so back button works and URL is shareable
    router.push("/compose/post");
  }
 }, [pathname, router]);

 const closeCreatePost = useCallback(() => {
   setIsCreatePostOpen(false);
   if (typeof window !== "undefined" && window.location.pathname === "/compose/post") {
     router.back();
   }
 }, [router]);

 useEffect(() => {
   // keep modal state in sync with the pathname
   if (pathname === "/compose/post") {
     setIsCreatePostOpen(true);
   } else {
     setIsCreatePostOpen(false);
   }
 }, [pathname]);

 const contextValue = {
  isCreatePostOpen,
  openCreatePost,
  closeCreatePost
 }

 return (
  <AppContext.Provider value={contextValue}>
  {children}
  </AppContext.Provider>
 )
}

export default AppContextProvider;