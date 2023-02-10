import { userAuth } from "@/contexts/AuthContext";
import { useBookStore } from "@/contexts/store";
import Button from "@/shared/components/Button";
import { db } from "@/utils/firebase";
import { Transition, Dialog } from "@headlessui/react";
import { ArrowLeftIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { Unsubscribe } from "firebase/auth";
import { query, collection, orderBy, onSnapshot } from "firebase/firestore";
import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NewRiddle from "./Riddle/components/NewRiddle";

const Book = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [riddles, setRiddles] = useState<any>();
  const { currentUser, loading } = userAuth();
  const params = useParams();
  const bookData = useBookStore((state: any) => state.bookData);
  const bookId = params.bookId;
  const navigate = useNavigate();
  const onBack = () => {
    navigate("/");
  };

  const onViewRiddle = (id: string) => {
    navigate(`/${bookId}/${id}`);
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/");
      return;
    } else if (currentUser?.uid) {
      let unsub: Unsubscribe;
      try {
        const q = query(
          collection(db, "books", bookId!, "riddles"),
          orderBy("date", "desc")
        );
        unsub = onSnapshot(q, (querySnapshot) => {
          const allRiddles = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          setRiddles(allRiddles);
        });
      } catch (e) {
        console.error(
          "Something went wrong while fetching riddles.",
          e?.toString()
        );
      }
      return () => {
        if (unsub) {
          unsub();
        }
      };
    }
  }, [currentUser, loading]);

  return (
    <div>
      <div className="flex w-full">
        <div
          onClick={onBack}
          className="flex cursor-pointer items-center justify-center gap-2 hover:underline"
        >
          <ArrowLeftIcon className="h-4" /> Back
        </div>
      </div>

      <div className="my-2 font-bold">{bookData.name}</div>
      <div className="flex w-full items-center justify-between">
        <span className="my-5 text-2xl">Riddles</span>
        <Button onClick={() => setIsOpen(true)} color={"primary"}>
          New Riddle
        </Button>
      </div>
      <div className="grid  w-full grid-cols-2 justify-center gap-2 md:grid-cols-5 md:justify-start md:gap-5">
        {riddles &&
          riddles.map((book: any) => (
            <div
              key={book.id}
              onClick={() => onViewRiddle(book.id)}
              className="flex h-[150px]  cursor-pointer flex-col items-center justify-center gap-3 rounded-xl bg-zinc-800 p-4 text-center text-sm text-zinc-400 transition-all duration-150 ease-in-out hover:bg-zinc-900 hover:shadow-lg md:h-[250px]  md:text-base"
            >
              <PuzzlePieceIcon className="h-12 text-zinc-300  md:h-24" />
              <div className="line-clamp-2 md:line-clamp-3 text-sm font-semibold text-zinc-100 md:text-base">
                {book.name}
              </div>
            </div>
          ))}
        {riddles && riddles.length === 0 && <div>No riddles found</div>}
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
                <Dialog.Panel className="flex w-full max-w-[860px] transform items-center justify-center overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <NewRiddle
                    onConfirmed={() => setIsOpen(false)}
                    bookId={bookId!}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Book;
