import { useContext, useState, useEffect, createContext } from 'react';
import {
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider
} from 'firebase/auth';
import { doc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import { auth, db } from '@/utils/firebase';
import { getAuthError } from '@/shared/helpers/getAuthError.helper';
import toast from 'react-hot-toast';
import Auth from '@/auth/AuthDialog';

export interface AuthContextInterface {
  currentUser: User | undefined;
  userData: any | undefined;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithPopup: (provider: string) => any;
}

const AuthContext = createContext<AuthContextInterface>(
  {} as AuthContextInterface
);

export const AuthProvider = ({ children }: any) => {
  const [currentUser, setCurrentUser] = useState<User>();
  const [userData, setUserData] = useState<any>();
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    return signOut(auth);
  };

  const getProvider = (provider: string) => {
    switch (provider) {
      case 'google': {
        return new GoogleAuthProvider();
      }
      case 'google.com': {
        return new GoogleAuthProvider();
      }
      case 'twitter': {
        return new TwitterAuthProvider();
      }
      case 'twitter.com': {
        return new TwitterAuthProvider();
      }
      case 'facebook': {
        return new FacebookAuthProvider();
      }
      case 'facebook.com': {
        return new FacebookAuthProvider();
      }
      default: {
        return new GoogleAuthProvider();
      }
    }
  };

  const loginWithPopup = async (provider: string) => {
    const currentProvider = getProvider(provider);
    signInWithPopup(auth, currentProvider)
      .then(async (result) => {
        const user = result.user;
        await checkUserExists(user, provider);
        return;
      })
      .catch((error) => {
        console.log(error.toString());
        console.error(getAuthError(error.code));
        console.error(error);
        if (error.code === 'auth/account-exists-with-different-credential') {
          toast.error('You have used the same email with an another provider!');
        }
      });
  };

  const checkUserExists = async (user: User, provider: string) => {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return;
    } else {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          id: user.uid,
          dateCreated: Timestamp.fromDate(new Date()),
          role: 'normal'
        });
      } catch (error) {
        console.error(getAuthError('err'));
      }
    }
  };

  const authStateChanged = async (user: any) => {
    setLoading(true);
    if (!user) {
      setUserData(null);
      setCurrentUser(undefined);
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setUserData(doc.data());
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authStateChanged);
    return () => unsubscribe();
  }, []);

  const value: AuthContextInterface = {
    currentUser,
    userData,
    loading,
    logout,
    loginWithPopup
  };

  return (
    <AuthContext.Provider value={value}>
      <>{currentUser && currentUser.uid ? children : <Auth />}</>
    </AuthContext.Provider>
  );
};

export const userAuth = () => {
  return useContext(AuthContext);
};
