import { useContext, useState, useEffect, createContext } from 'react';
import {
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  browserLocalPersistence,
  sendPasswordResetEmail,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  verifyPasswordResetCode,
  confirmPasswordReset,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  linkWithPopup
} from 'firebase/auth';
import {
  doc,
  setDoc,
  Timestamp,
  onSnapshot,
  addDoc,
  collection
} from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import { auth, db } from '@/utils/firebase';
import { getAuthError } from '@/shared/helpers/getAuthError.helper';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export interface AuthContextInterface {
  currentUser: User | undefined;
  userData: any | undefined;
  userRole: string;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithPopup: (provider: string) => any;
}

const AuthContext = createContext<AuthContextInterface>(
  {} as AuthContextInterface
);

const generateId = (length = 10): string => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const AuthProvider = ({ children }: any) => {
  const [currentUser, setCurrentUser] = useState<User>();
  const [userData, setUserData] = useState<any>();
  const [userPackages, setUserPackages] = useState<any>();
  const [userRole, setUserRole] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [hashedUserData, setHashedUserData] = useState({
    email: '',
    displayName: '',
    id: ''
  });

  const navigate = useNavigate();

  const [oldProvider, setOldProvider] = useState<
    GoogleAuthProvider | TwitterAuthProvider | FacebookAuthProvider
  >();
  const [currentProvider, setCurrentProvider] = useState<
    GoogleAuthProvider | TwitterAuthProvider | FacebookAuthProvider
  >();
  const [checkoutSessionLoading, setCheckoutSessionLoading] = useState(false);

  const signup = async (name: string, email: string, password: string) => {
    const user = await createUserWithEmailAndPassword(auth, email, password);
    return setDoc(doc(db, 'users', user.user.uid), {
      name,
      email,
      id: user.user.uid,
      dateCreated: Timestamp.fromDate(new Date()),
      boarded: 'active'
    });
  };

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean
  ) => {
    await setPersistence(
      auth,
      !rememberMe ? browserSessionPersistence : browserLocalPersistence
    );
    return signInWithEmailAndPassword(auth, email, password);
  };

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

  const getProviderString = (provider: string) => {
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
          // const pendingCred = error.credential;
          // const email = error.email;
          // console.log("email", error);
          // console.log("here");
          // fetchSignInMethodsForEmail(auth, email)
          //   .then((methods) => {
          //     console.log(methods[0]);
          //     const oldProviderMem = getProvider(methods[0]);
          //     setOldProvider(oldProviderMem);
          //     setCurrentProvider(currentProvider);
          //     setOpen(true);
          //   })
          //   .catch((e) => {
          //     console.log("error here");
          //     console.error(e);
          //   });
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
          boarded: 'active'
        });
        navigate('/albums/new');
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
      setUserPackages({});
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setUserData(doc.data());
    });
    onSnapshot(doc(db, 'accounts', user.uid), (doc) => {
      setUserPackages({
        smPack: doc.data()?.smPack,
        lgPack: doc.data()?.lgPack,
        xlPack: doc.data()?.xlPack
      });
      setUserRole(doc.data()?.role);
      setLoading(false);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authStateChanged);
    setTimeout(() => {
      getRedirectResult(auth)
        .then(async (result) => {
          if (result && result.user) {
            const user = result.user;
            await checkUserExists(user, result.providerId || 'unknown');
            return;
          }
        })
        .catch((error) => {
          console.error(getAuthError(error.code));
          if (error.code === 'auth/account-exists-with-different-credential') {
            toast.error(
              'You have used the same email with an another auth provider!'
            );
          }
        });
    }, 1000);
    return () => unsubscribe();
  }, []);

  const value: AuthContextInterface = {
    currentUser,
    userData,
    userRole,
    loading,
    logout,
    loginWithPopup
  };

  return (
    <AuthContext.Provider value={value}>
      <>{children}</>
    </AuthContext.Provider>
  );
};

export const userAuth = () => {
  return useContext(AuthContext);
};
