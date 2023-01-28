/* eslint-disable react/no-unescaped-entities */
import { userAuth } from '@/contexts/AuthContext';
import Button from '@/shared/components/Button';
import google from '/google.svg';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const { loginWithPopup, loading, currentUser } = userAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/albums');
    }
  });

  const onClickLoginWithProvider = async (provider: string) => {
    await loginWithPopup(provider);
  };
  return (
    <>
      {!loading && !currentUser && (
        <div className="relative h-[100vh] bg-cover bg-no-repeat">
          <div className="absolute right-0 left-0 top-0 bottom-0 z-30 flex h-[90vh] items-center justify-center gap-3">
            <div className="w-11/12 rounded-lg bg-zinc-900/90 shadow-lg backdrop-blur-sm md:w-[570px]">
              <div className="my-6 flex w-full flex-col items-center justify-center p-4">
                <a href="/">SOLV</a>
                Admin
                <hr />
                <div className="my-5 flex w-full flex-col items-center justify-center gap-2">
                  <Button
                    onClick={() => onClickLoginWithProvider('google')}
                    color={'lightGray'}
                  >
                    <div className="flex w-[260px] items-center justify-start gap-5 px-6 text-sm md:w-[320px] md:gap-5 md:text-lg">
                      <img className="h-7 w-7" src={google} />
                      <span> Continue with Google</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Auth;
