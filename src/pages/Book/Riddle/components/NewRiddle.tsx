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
      const DLink = await url;

      await setDoc(
        doc(db, "books", bookId, "riddles", id),
        {
          [field]: DLink,
        },
        { merge: true }
      );
    }
  };
  const defaultValues = {
    successMsgType: "text",
    hintType: "text",
    hint2Type: "text",
    hint3Type: "text",
    hint4Type: "text",
    numberHints: 0,
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
            hintType: data.hintType,
            numberHints: data.numberHints,
            hintText: data.hintText || "",
            hint2Type: data.hint2Type,
            hint2Text: data.hint2Text || "",
            hint3Type: data.hint3Type,
            hint3Text: data.hint3Text || "",
            hint4Type: data.hint4Type,
            hint4Text: data.hint4Text || "",
            successMsgType: data.successMsgType,
            successMsgText: data.successMsgText || "",
            answer: data.answer,
            bookId,
          }
        );
        setCurrentMediaUpload("riddle image");
        await uploadFile("riddleImage", data.riddleImage, docRef.id);
        if (data.hintType !== "text") {
          setCurrentMediaUpload("hint 1 media");
          await uploadFile("hintMedia", data.hintMedia, docRef.id);
        }
        if (data.hint2Type !== "text") {
          setCurrentMediaUpload("hint 2 media");
          await uploadFile("hint2Media", data.hint2Media, docRef.id);
        }
        if (data.hint3Type !== "text") {
          setCurrentMediaUpload("hint 3 media");
          await uploadFile("hint3Media", data.hint3Media, docRef.id);
        }
        if (data.hint4Type !== "text") {
          setCurrentMediaUpload("hint 4 media");
          await uploadFile("hint4Media", data.hint4Media, docRef.id);
        }
        if (data.successMsgType !== "text") {
          setCurrentMediaUpload("success message media");
          await uploadFile("successMsgMedia", data.successMsgMedia, docRef.id);
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
