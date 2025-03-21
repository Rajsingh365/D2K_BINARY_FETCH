import { createContext, useContext, useState } from "react";
import { MarketplaceItem } from "@/lib/marketPlaceData";
const AuthUserContext = createContext(null);

export const useAuthUser = () => useContext(AuthUserContext);

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [usersAgent, setUsersAgent] = useState< MarketplaceItem[]>([]);
  const [cartAgent, setCartAgent] = useState< MarketplaceItem[]>([])

  return (
    <AuthUserContext.Provider value={{ authUser, setAuthUser, usersAgent, setUsersAgent, cartAgent, setCartAgent }}>
      {children}
    </AuthUserContext.Provider>
  );
}