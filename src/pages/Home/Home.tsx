import { userAuth } from '@/contexts/AuthContext';
import { useBookStore } from '@/contexts/store';
import Button from '@/shared/components/Button';
import { db } from '@/utils/firebase';
import { Dialog, Transition } from '@headlessui/react';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { Unsubscribe } from 'firebase/auth';
import { query, collection, onSnapshot, orderBy } from 'firebase/firestore';
import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewBook from '../Book/components/NewBook';

const Home = () => {
  let [isOpen, setIsOpen] = useState(false);
  const [books, setBooks] = useState<any>();
  const { currentUser, loading } = userAuth();
  const updateBook = useBookStore((state: any) => state.updateBook);

  const navigate = useNavigate();

  const onViewBook = (bookData: any, id: string) => {
    updateBook(bookData);
    navigate('/' + id);
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/');
      return;
    } else if (currentUser?.uid) {
      let unsub: Unsubscribe;
      try {
        const q = query(collection(db, 'books'), orderBy('date', 'desc'));
        unsub = onSnapshot(q, (querySnapshot) => {
          const allBooks = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
          }));

          setBooks(allBooks);
        });
      } catch (e) {
        console.error(
          'Something went wrong while fetching books.',
          e?.toString()
        );
      }
      return () => {
        unsub();
      };
    }
  }, [currentUser, loading]);

  return (
    <div className="w-full flex-col gap-5">
      <div className="w-full flex justify-between items-center">
        <span className="text-2xl my-5">Books</span>
        <Button onClick={() => setIsOpen(true)} color={'primary'}>
          New Book
        </Button>
      </div>
      <div className="grid  w-full grid-cols-2 justify-center gap-2 md:grid-cols-5 md:justify-start md:gap-5">
        {books &&
          books.map((book: any) => (
            <div
              key={book.id}
              onClick={() => onViewBook(book, book.id)}
              className="flex h-[150px]  cursor-pointer flex-col items-center justify-center gap-3 rounded-xl bg-zinc-800 p-4 text-center text-sm text-zinc-400 transition-all duration-150 ease-in-out hover:bg-zinc-900 hover:shadow-lg md:h-[250px]  md:text-base"
            >
              <BookOpenIcon className="h-12 text-zinc-300  md:h-24" />
              <div className="line-clamp-2 md:line-clamp-3 text-sm font-semibold text-zinc-100 md:text-base">
                {book.name}
              </div>
            </div>
          ))}
      </div>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    New Book
                  </Dialog.Title>
                  <NewBook onConfirmed={() => setIsOpen(false)} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Home;
