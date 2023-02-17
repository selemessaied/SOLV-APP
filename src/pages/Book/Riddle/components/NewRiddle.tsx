import { userAuth } from "@/contexts/AuthContext";
import LoadingCircle from "@/shared/components/LoadingCircle";
import { db, storage } from "@/utils/firebase";
import { addDoc, collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import toast from "react-hot-toast";
import { FormData } from "./RiddleForm";
import RiddleForm from "./RiddleForm";

export interface NewRiddleProps {
  bookId: string;
  onConfirmed: () => void;
}

const NewRiddle = ({ onConfirmed, bookId }: NewRiddleProps) => {
  const { currentUser } = userAuth();
  const [percentage, setPercentage] = useState(0);
  const [currentMediaUpload, setCurrentMediaUpload] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const uploadFile = async (field: string, file: any, id: string) => {
    if (file && file.length) {
      const ext = file[0].name.split(".").pop();
      const storageRef = ref(
        storage,
        `books/${bookId}/riddles/${id}/${field}.${ext}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file[0]);

      const url = new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snap) => {
            const percentUploaded = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100
            );
            setPercentage(percentUploaded);
          },
          (error) => {
            alert(error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
      return url;
    }
  };
  const defaultValues = {
    successMsgType: "text",
  };
  const onSubmit = (data: FormData) => {
    setIsLoading(true);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const docRef = await addDoc(
          collection(db, "books", bookId, "riddles"),
          {
            name: data.name,
            addedBy: currentUser!.uid,
            date: Timestamp.fromDate(new Date()),
            successMsgType: data.successMsgType,
            successMsgText: data.successMsgText || "",
            answer: data.answer,
            bookId,
          }
        );
        setCurrentMediaUpload("riddle image");
        const riddleImageLink = await uploadFile(
          "riddleImage",
          data.riddleImage,
          docRef.id
        );

        await setDoc(
          doc(db, "books", bookId, "riddles", docRef.id),
          {
            riddleImage: riddleImageLink,
          },
          { merge: true }
        );

        const promise = data.hints.map(async (hint, index) => {
          if (hint.type !== "text") {
            setCurrentMediaUpload(`hint ${index} media`);
            const link = await uploadFile(
              `hint${index}Media`,
              hint.media,
              docRef.id
            );
            return addDoc(
              collection(db, "books", bookId, "riddles", docRef.id, "hints"),
              {
                text: hint.text,
                id: hint.id,
                media: link,
                type: hint.type,
              }
            );
          } else {
            return addDoc(
              collection(db, "books", bookId, "riddles", docRef.id, "hints"),
              {
                text: hint.text,
                id: hint.id,
                type: hint.type,
              }
            );
          }
        });

        await Promise.all(promise);

        if (data.successMsgType !== "text") {
          setCurrentMediaUpload("success message media");
          const successMediaLink = await uploadFile(
            "successMsgMedia",
            data.successMsgMedia,
            docRef.id
          );

          await setDoc(
            doc(db, "books", bookId, "riddles", docRef.id),
            {
              successMsgMedia: successMediaLink,
            },
            { merge: true }
          );
        }
        resolve();
        setIsLoading(false);
        onConfirmed();
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        reject(e);
      }
    });

    toast.promise(promise, {
      loading: "Loading",
      success: "Success!",
      error: "Something went wrong",
    });
  };
  return (
    <div>
      <RiddleForm
        isEdit={false}
        onSubmit={onSubmit}
        onCancel={onConfirmed}
        defaultValues={defaultValues}
      />
      {isLoading && (
        <div className="fixed inset-0 flex h-full w-full flex-col items-center justify-center gap-2 bg-white/30 font-semibold backdrop-blur-[6px]">
          <LoadingCircle />
          Uploading {currentMediaUpload} | {percentage}%
        </div>
      )}
    </div>
  );
};

export default NewRiddle;
