'use client'

import { createContext, ReactNode, useState } from "react";

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
 const [isCreatePostOpen, setIsCreatePostOpen] = useState(true);

  const openCreatePost = () => {
  setIsCreatePostOpen(true)
 };
 const closeCreatePost = () => {
   setIsCreatePostOpen(false)
 };

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