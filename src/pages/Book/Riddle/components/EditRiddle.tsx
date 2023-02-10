import { userAuth } from "@/contexts/AuthContext";
import LoadingCircle from "@/shared/components/LoadingCircle";
import { storage, db } from "@/utils/firebase";
import { setDoc, doc, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import toast from "react-hot-toast";
import RiddleForm, { FormData, Riddle } from "./RiddleForm";

export interface EditRiddleProps {
  bookId: string;
  riddleId: string;
  riddleData: Riddle;
  onConfirmed: () => void;
}

const EditRiddle = ({
  onConfirmed,
  bookId,
  riddleData,
  riddleId,
}: EditRiddleProps) => {
  const { currentUser } = userAuth();
  const [percentage, setPercentage] = useState(0);
  const [currentMediaUpload, setCurrentMediaUpload] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues = {
    name: riddleData.name,
    answer: riddleData.answer,
    successMsgType: riddleData.successMsgType,
    successMsgText: riddleData.successMsgText,
    successMsgMedia: riddleData.successMsgMedia,
    numberHints: riddleData.numberHints,
    hintType: riddleData.hintType,
    hintText: riddleData.hintText,
    hint2Type: riddleData.hint2Type,
    hint2Text: riddleData.hint2Text,
    hint3Type: riddleData.hint3Type,
    hint3Text: riddleData.hint3Text,
    hint4Type: riddleData.hint4Type,
    hint4Text: riddleData.hint4Text,
    hintMedia: riddleData.hintMedia,
    hint2Media: riddleData.hint2Media,
    hint3Media: riddleData.hint3Media,
    hint4Media: riddleData.hint4Media,
    riddleImage: riddleData.riddleImage,
  };

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

  const onSubmit = (data: FormData) => {
    setIsLoading(true);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        await setDoc(
          doc(db, "books", bookId, "riddles", riddleId),
          {
            name: data.name,
            updatedBy: currentUser!.uid,
            updatedAt: Timestamp.fromDate(new Date()),
            numberHints: data.numberHints,
            hintType: data.hintType,
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
          },
          { merge: true }
        );
        if (data.riddleImage) {
          await uploadFile("riddleImage", data.riddleImage, riddleId);
        }
        if (data.hintType !== "text" && data.hintMedia) {
          await uploadFile("hintMedia", data.hintMedia, riddleId);
        }
        if (data.hint2Type !== "text" && data.hint2Media) {
          await uploadFile("hint2Media", data.hint2Media, riddleId);
        }
        if (data.hint3Type !== "text" && data.hint3Media) {
          await uploadFile("hint3Media", data.hint3Media, riddleId);
        }
        if (data.hint4Type !== "text") {
          setCurrentMediaUpload("hint 4 media");
          await uploadFile("hint4Media", data.hint4Media, riddleId);
        }
        if (data.successMsgType !== "text" && data.successMsgMedia) {
          await uploadFile("successMsgMedia", data.successMsgMedia, riddleId);
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
        isEdit={true}
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

export default EditRiddle;
