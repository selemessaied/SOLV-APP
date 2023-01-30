import { userAuth } from '@/contexts/AuthContext';
import Button from '@/shared/components/Button';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

const Header = () => {
  const { currentUser, logout } = userAuth();

  return (
    <>
      <div className="flex h-16 w-full items-center justify-between">
        <Link aria-label="home" to="/">
          SOLV
        </Link>
        {currentUser?.uid && (
          <div className="flex gap-3">
            <Button onClick={logout} color="google">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Logout</span>
                <ArrowRightOnRectangleIcon className="h-4 text-black" />
              </div>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
