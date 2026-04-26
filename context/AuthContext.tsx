import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";

type AuthContextType = {
  user: User | null;
  role: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AUTH CONTEXT LOADED");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AUTH STATE TRIGGERED");
      console.log("CURRENT USER:", currentUser?.uid);

      setUser(currentUser);

      if (currentUser) {
        try {
          const userDoc = await getDoc(
            doc(db, "users", currentUser.uid)
          );

          if (userDoc.exists()) {
            console.log("ROLE FROM FIRESTORE:", userDoc.data().role);
            setRole(userDoc.data().role);
          } else {
            console.log("NO USER DOCUMENT FOUND");
            setRole(null);
          }
        } catch (error) {
          console.log("ERROR FETCHING ROLE:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};