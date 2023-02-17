import { userAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/utils/firebase";
import { Transition, Dialog } from "@headlessui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Unsubscribe } from "firebase/auth";
import {
  onSnapshot,
  doc,
  deleteDoc,
  collection,
  query,
} from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import EditRiddle from "./components/EditRiddle";
import MediaCheck from "./components/MediaCheck";

const Riddle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModal] = useState(false);
  const [riddleData, setRiddleData] = useState<any>();
  const [hintsData, setHintsData] = useState<any>();
  const { currentUser, loading } = userAuth();
  const params = useParams();
  const bookId = params.bookId;
  const riddleId = params.riddleId;
  const navigate = useNavigate();
  const onBack = () => {
    navigate("/" + bookId);
  };

  const onDelete = () => {
    setDeleteModal(true);
  };

  const deleteRiddle = async () => {
    setDeleteModal(false);
    const promise = new Promise(async (resolve, rej) => {
      try {
        hintsData.map(async (hint: any) => {
          await deleteDoc(
            doc(
              db,
              "books",
              bookId!,
              "riddles",
              riddleId!,
              "hints",
              hint.fireId
            )
          );
        });
        await deleteDoc(doc(db, "books", bookId!, "riddles", riddleId!));
        const storageRef = ref(storage, `books/${bookId}/riddles/${riddleId}/`);

        const res = await listAll(storageRef);
        const promise = res.items.map((itemRef) => {
          return deleteObject(itemRef);
        });
        await Promise.all(promise);
        navigate("/" + bookId);
        resolve("e");
      } catch (e) {
        rej;
        console.error(e);
      }
    });

    toast.promise(promise, {
      loading: "Loading",
      success: "Riddle Deleted!",
      error: "Something went wrong",
    });
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/");
      return;
    } else if (currentUser?.uid) {
      let unsub: Unsubscribe;
      let unsubHints: Unsubscribe;
      try {
        const q = query(
          collection(db, "books", bookId!, "riddles", riddleId!, "hints")
        );
        unsub = onSnapshot(q, (querySnapshot) => {
          const allHints = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            fireId: doc.id,
          }));

          setHintsData(allHints);
        });
        unsub = onSnapshot(
          doc(db, "books", bookId!, "riddles", riddleId!),
          (doc) => {
            setRiddleData(doc.data());
          }
        );
      } catch (e) {
        console.error("Something went wrong while fetching your albums.");
      }
      return () => {
        if (unsub) {
          unsub();
        }
        if (unsubHints) {
          unsubHints();
        }
      };
    }
  }, []);
  return (
    <div className="mb-10 flex h-full flex-col gap-2">
      <div className="flex w-full">
        <div
          onClick={onBack}
          className="flex cursor-pointer items-center justify-center gap-2 hover:underline"
        >
          <ArrowLeftIcon className="h-4" /> Back
        </div>
      </div>
      <div className="flex gap-5">
        <button
          onClick={() => setIsOpen(true)}
          className="my-5 w-fit rounded-full bg-zinc-600 px-4 py-2 text-white"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="my-5 w-fit rounded-full bg-red-600 px-4 py-2 text-white"
        >
          Delete
        </button>
      </div>
      {riddleData && (
        <div className="mb-10 flex flex-col gap-3 py-10">
          <div>
            Name: <b>{riddleData.name}</b>
          </div>
          <div>
            Added by: <b> {riddleData.addedBy}</b>
          </div>
          <div>
            Riddle image:{" "}
            <img
              className="h-32 w-32 object-cover"
              src={riddleData.riddleImage}
            />
          </div>
          <div>
            Answer: <b>{riddleData.answer}</b>
          </div>
          <div>
            Date: <b>{riddleData.date.toDate().toLocaleDateString("fr-FR")}</b>
          </div>
          <div>
            Number hints: <b>{hintsData.length}</b>
          </div>
          {/* <div className="flex flex-col gap-3 divide-y-2"> */}
          {hintsData &&
            hintsData.map((hint: any, index: number) => (
              <div key={hint.id}>
                <hr />
                <div>
                  Hint {index + 1} type: <b>{hint.type}</b>
                </div>
                {hint.type === "text" && (
                  <div>
                    Hint {index + 1} text: <b>{hint.text}</b>
                  </div>
                )}
                <MediaCheck
                  index={index + 1}
                  media={hint.media}
                  label={"hint"}
                  type={hint.type}
                />
              </div>
            ))}
          {/* </div> */}
          <hr />
          <div>
            Success msg type: <b> {riddleData.successMsgType}</b>
          </div>
          {riddleData.successMsgType === "text" && (
            <div>
              Success msg text: <b>{riddleData.successMsgText}</b>
            </div>
          )}
          <MediaCheck
            media={riddleData.successMsgMedia}
            type={riddleData.successMsgType}
            label={"Success Message"}
            index={1}
          />
          <div>
            Link:{" "}
            <b className="break-all">
              {"/books/" + bookId + "/riddles/" + riddleId}
            </b>
          </div>
        </div>
      )}

      <Transition appear show={deleteModalOpen} as={Fragment}>
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
            {/* Container to center the panel */}
            <div className="flex min-h-full items-center justify-center p-4">
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
                    Delete Riddle
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this Riddle?
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-5">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={deleteRiddle}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
                      onClick={() => setDeleteModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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
                  <EditRiddle
                    onConfirmed={() => setIsOpen(false)}
                    riddleData={{ ...riddleData, hints: hintsData }}
                    riddleId={riddleId!}
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

export default Riddle;
