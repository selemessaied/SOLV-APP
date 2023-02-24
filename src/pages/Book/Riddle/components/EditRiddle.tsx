import { userAuth } from "@/contexts/AuthContext";
import LoadingCircle from "@/shared/components/LoadingCircle";
import { storage, db } from "@/utils/firebase";
import {
  setDoc,
  doc,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import toast from "react-hot-toast";
import RiddleForm, { FormData } from "./RiddleForm";

export interface EditRiddleProps {
  bookId: string;
  riddleId: string;
  riddleData: any;
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
    hints: riddleData.hints,
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
      return url;
    }
  };

  const onSubmit = (data: FormData, dirtyFields: any) => {
    const getHintFireId = (id: string) => {
      const index = riddleData.hints.findIndex((hint: any) => hint.id === id);
      return riddleData.hints[index].fireId;
    };

    setIsLoading(true);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        await setDoc(
          doc(db, "books", bookId, "riddles", riddleId),
          {
            name: data.name,
            updatedBy: currentUser!.uid,
            updatedAt: Timestamp.fromDate(new Date()),
            successMsgType: data.successMsgType,
            successMsgText: data.successMsgText || "",
            answer: data.answer,
          },
          { merge: true }
        );
        if (dirtyFields.riddleImage) {
          setCurrentMediaUpload("riddle image");
          const riddleImageLink = await uploadFile(
            "riddleImage",
            data.riddleImage,
            riddleId
          );

          await setDoc(
            doc(db, "books", bookId, "riddles", riddleId),
            {
              riddleImage: riddleImageLink,
            },
            { merge: true }
          );
        }

        const oldHintsIds = riddleData.hints.map((hint: any) => hint.id);
        const newHintsIds = data.hints.map((hint: any) => hint.id);

        if (data.hints?.length > 0) {
          let index = -1;
          for (const hint of data.hints) {
            index++;
            if (!oldHintsIds.includes(hint.id)) {
              if (hint.type !== "text") {
                setCurrentMediaUpload(`hint ${index} media`);
                const link = await uploadFile(
                  `hint${index}Media`,
                  hint.media,
                  riddleId
                );
                await addDoc(
                  collection(db, "books", bookId, "riddles", riddleId, "hints"),
                  {
                    text: hint.text,
                    id: hint.id,
                    media: link,
                    type: hint.type,
                    order: hint.order,
                  }
                );
              } else {
                await addDoc(
                  collection(db, "books", bookId, "riddles", riddleId, "hints"),
                  {
                    text: hint.text,
                    id: hint.id,
                    type: hint.type,
                    order: hint.order,
                  }
                );
              }
            }
            if (!newHintsIds.includes(hint.id)) {
              await deleteDoc(
                doc(
                  db,
                  "books",
                  bookId!,
                  "riddles",
                  riddleId!,
                  "hints",
                  riddleData.hints[index].fireId
                )
              );
            }
          }
        }

        riddleData.hints.map((hint: any) => {
          if (!newHintsIds.includes(hint.id)) {
            return deleteDoc(
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
          }
        });

        if (dirtyFields.hints?.length > 0) {
          dirtyFields.hints.map(async (hintDirty: any, index: number) => {
            const getUpdatedHintData = () => {
              if (
                riddleData.hints.length > 0 &&
                riddleData.hints[index] &&
                riddleData.hints[index].id
              ) {
                const idd = riddleData.hints[index].id;
                const newIndex = data.hints.findIndex(
                  (hint) => hint.id === idd
                );
                return data.hints[newIndex];
              }
            };

            const updatedHintData = getUpdatedHintData();

            if (
              hintDirty.media &&
              updatedHintData &&
              updatedHintData.type !== "text"
            ) {
              setCurrentMediaUpload(`hint ${index} media update`);
              const link = await uploadFile(
                `hint${index}Media`,
                updatedHintData.media,
                riddleId
              );
              const id = getHintFireId(updatedHintData.id!);
              await setDoc(
                doc(db, "books", bookId, "riddles", riddleId, "hints", id),
                {
                  media: link,
                  type: updatedHintData.type,
                },
                { merge: true }
              );
            } else if (
              hintDirty.text &&
              updatedHintData &&
              updatedHintData.type === "text"
            ) {
              const id = getHintFireId(updatedHintData.id!);
              await setDoc(
                doc(db, "books", bookId, "riddles", riddleId, "hints", id),
                {
                  text: updatedHintData.text,
                  type: updatedHintData.type,
                  order: updatedHintData.order,
                },
                { merge: true }
              );
            }
          });
        }

        if (dirtyFields.successMsgMedia) {
          if (data.successMsgType !== "text") {
            setCurrentMediaUpload("success message media");
            const successMediaLink = await uploadFile(
              "successMsgMedia",
              data.successMsgMedia,
              riddleId
            );

            await setDoc(
              doc(db, "books", bookId, "riddles", riddleId),
              {
                successMsgMedia: successMediaLink,
              },
              { merge: true }
            );
          }
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
