import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebase.init";

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const logOut = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = Boolean(
    user && (!adminEmail || user.email?.toLowerCase() === adminEmail),
  );

  const authInfo = {
    user,
    isAdmin,
    authLoading,
    setAuthLoading,
    logOut,
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
