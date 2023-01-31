import { userAuth } from "@/contexts/AuthContext";
import Select from "@/shared/components/Select";
import { storage, db } from "@/utils/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { setDoc, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
export interface Riddle {
  id: string;
  name: string;
  answer: string;
  bookId: string;
  successMsgType: string;
  successMsgText: string;
  successMsgMedia: string;
  hintType: string;
  hintText: string;
  hintMedia: string;
  hint2Type: string;
  hint2Text: string;
  hint2Media: string;
  hint3Type: string;
  hint3Text: string;
  hint3Media: string;
  riddleImage: string;
  date: any;
  addedBy: string;
}

export interface EditRiddleProps {
  bookId: string;
  riddleId: string;
  riddleData: Riddle;
  onConfirmed: () => void;
}

const typeOptions = [
  { label: "Text", value: "text" },
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
  { label: "Sound", value: "sound" },
];

const riddleSchema = z.object({
  name: z.string().min(1).max(256),
  answer: z.string().min(1).max(256),
  successMsgType: z.string().min(1).max(256),
  successMsgText: z.string().min(1).max(256).optional(),
  successMsgMedia: z.any().optional(),
  hintType: z.string().min(1).max(256),
  hintText: z.string().min(1).max(256).optional(),
  hint2Type: z.string().min(1).max(256),
  hint2Text: z.string().min(1).max(256).optional(),
  hint3Type: z.string().min(1).max(256),
  hint3Text: z.string().min(1).max(256).optional(),
  hintMedia: z.any().optional(),
  hint2Media: z.any().optional(),
  hint3Media: z.any().optional(),
  riddleImage: z.any(),
});

type FormData = z.infer<typeof riddleSchema>;

const EditRiddle = ({
  onConfirmed,
  bookId,
  riddleData,
  riddleId,
}: EditRiddleProps) => {
  const { currentUser } = userAuth();

  const {
    register,
    unregister,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: riddleData.name,
      answer: riddleData.answer,
      successMsgType: riddleData.successMsgType,
      successMsgText: riddleData.successMsgText,
      successMsgMedia: riddleData.successMsgMedia,
      hintType: riddleData.hintType,
      hintText: riddleData.hintText,
      hint2Type: riddleData.hint2Type,
      hint2Text: riddleData.hint2Text,
      hint3Type: riddleData.hint3Type,
      hint3Text: riddleData.hint3Text,
      hintMedia: riddleData.hintMedia,
      hint2Media: riddleData.hint2Media,
      hint3Media: riddleData.hint3Media,
      riddleImage: riddleData.riddleImage,
    },
    resolver: zodResolver(riddleSchema),
  });

  const onTypeChange = (
    type: string,
    inputTypeName: any,
    inputPrefix: string
  ) => {
    setValue(inputTypeName, type);
    const textFieldName = (inputPrefix + "Text") as any;
    const mediaFieldName = (inputPrefix + "Media") as any;
    if (type === "text") {
      register(textFieldName);
      unregister(mediaFieldName);
    } else {
      register(mediaFieldName);
      unregister(textFieldName);
    }
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
          () => {},
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
    console.log(data);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        await setDoc(
          doc(db, "books", bookId, "riddles", riddleId),
          {
            name: data.name,
            updatedBy: currentUser!.uid,
            hintType: data.hintType,
            hintText: data.hintText || "",
            hint2Type: data.hint2Type,
            hint2Text: data.hint2Text || "",
            hint3Type: data.hint3Type,
            hint3Text: data.hint3Text || "",
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
        if (data.successMsgType !== "text" && data.successMsgMedia) {
          await uploadFile("successMsgMedia", data.successMsgMedia, riddleId);
        }
        resolve();
        onConfirmed();
      } catch (e) {
        console.error(e);
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
    <div className="w-full py-5 px-10">
      <div className="my-5 text-xl">Update riddle:</div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Current riddle Image
            </label>
            <img src={riddleData.riddleImage} />
            <label htmlFor="step" className="font-bold text-gray-600">
              Update riddle image
            </label>
            <input {...register("riddleImage")} type="file" />

            <div className="h-7 text-red-500">
              {errors.riddleImage?.message?.toString() || ""}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Name
            </label>
            <input
              className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
              placeholder="Name"
              required
              {...register("name")}
            />

            <div className="h-7 text-red-500">
              {errors.name?.message?.toString()}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Answer
            </label>
            <input
              className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
              placeholder="Answer"
              required
              {...register("answer")}
            />

            <div className="h-7 text-red-500">
              {errors.answer?.message?.toString()}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint 1 Type
            </label>
            <div className="w-[150px]">
              <Select
                initValue={{
                  value: riddleData.hintType,
                  label: riddleData.hintType,
                }}
                options={typeOptions}
                onChange={(value) => onTypeChange(value, "hintType", "hint")}
              />
            </div>

            <div className="h-7 text-red-500">
              {errors.hintType?.message?.toString()}
            </div>
          </div>

          {getValues().hintType === "text" ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 1 Text
              </label>
              <input
                className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                placeholder="Hint Text"
                required
                {...register("hintText")}
              />

              <div className="h-7 text-red-500">
                {errors.hintText?.message?.toString()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {riddleData.hintMedia && riddleData.hintType === "image" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 1 Image
                  </label>
                  <img src={riddleData.hintMedia} />
                </div>
              )}
              {riddleData.hintMedia && riddleData.hintType === "video" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 1 Video
                  </label>
                  <video src={riddleData.hintMedia} controls />
                </div>
              )}
              {riddleData.hintMedia && riddleData.hintType === "sound" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 1 Audio
                  </label>
                  <audio src={riddleData.hintMedia} controls />
                </div>
              )}
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 1 Media
              </label>
              <input {...register("hintMedia")} type="file" />
              <div className="h-7 text-red-500">
                {errors.hintMedia?.message?.toString()}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint 2 Type
            </label>
            <div className="w-[150px]">
              <Select
                initValue={{
                  value: riddleData.hint2Type,
                  label: riddleData.hint2Type,
                }}
                options={typeOptions}
                onChange={(value) => onTypeChange(value, "hint2Type", "hint2")}
              />
            </div>

            <div className="h-7 text-red-500">
              {errors.hint2Type?.message?.toString()}
            </div>
          </div>

          {getValues().hint2Type === "text" ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 2 Text
              </label>
              <input
                className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                placeholder="Hint Text"
                required
                {...register("hint2Text")}
              />

              <div className="h-7 text-red-500">
                {errors.hint2Text?.message?.toString()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {riddleData.hint2Media && riddleData.hint2Type === "image" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 2 Image
                  </label>
                  <img src={riddleData.hint2Media} />
                </div>
              )}
              {riddleData.hint2Media && riddleData.hint2Type === "video" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 2 Video
                  </label>
                  <video src={riddleData.hint2Media} controls />
                </div>
              )}
              {riddleData.hint2Media && riddleData.hint2Type === "sound" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 2 Audio
                  </label>
                  <audio src={riddleData.hint2Media} controls />
                </div>
              )}
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 2 Media
              </label>
              <input {...register("hint2Media")} type="file" />
              <div className="h-7 text-red-500">
                {errors.hint2Media?.message?.toString()}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint 3 Type
            </label>
            <div className="w-[150px]">
              <Select
                initValue={{
                  value: riddleData.hint3Type,
                  label: riddleData.hint3Type,
                }}
                options={typeOptions}
                onChange={(value) => onTypeChange(value, "hint3Type", "hint3")}
              />
            </div>

            <div className="h-7 text-red-500">
              {errors.hint3Type?.message?.toString()}
            </div>
          </div>

          {getValues().hint3Type === "text" ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 3 Text
              </label>
              <input
                className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                placeholder="Hint Text"
                required
                {...register("hint3Text")}
              />

              <div className="h-7 text-red-500">
                {errors.hint3Text?.message?.toString()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {riddleData.hint3Media && riddleData.hint3Type === "image" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 3 Image
                  </label>
                  <img src={riddleData.hint3Media} />
                </div>
              )}
              {riddleData.hint3Media && riddleData.hint3Type === "video" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 3 Video
                  </label>
                  <video src={riddleData.hint3Media} controls />
                </div>
              )}
              {riddleData.hint3Media && riddleData.hint3Type === "sound" && (
                <div>
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Current Hint 3 Audio
                  </label>
                  <audio src={riddleData.hint3Media} controls />
                </div>
              )}
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 3 Media
              </label>
              <input {...register("hint3Media")} type="file" />
              <div className="h-7 text-red-500">
                {errors.hint3Media?.message?.toString()}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Success Message Type
            </label>
            <div className="w-[150px]">
              <Select
                initValue={{
                  value: riddleData.successMsgType,
                  label: riddleData.successMsgType,
                }}
                options={typeOptions}
                onChange={(value) =>
                  onTypeChange(value, "successMsgType", "successMsg")
                }
              />
            </div>

            <div className="h-7 text-red-500">
              {errors.successMsgType?.message?.toString()}
            </div>
          </div>

          {getValues().successMsgType === "text" ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Success Message Text
              </label>
              <input
                className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                placeholder="Hint Text"
                required
                {...register("successMsgText")}
              />

              <div className="h-7 text-red-500">
                {errors.successMsgText?.message?.toString()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {riddleData.successMsgMedia &&
                riddleData.successMsgType === "image" && (
                  <div>
                    <label htmlFor="step" className="font-bold text-gray-600">
                      Current Success Message Image
                    </label>
                    <img src={riddleData.successMsgMedia} />
                  </div>
                )}
              {riddleData.successMsgMedia &&
                riddleData.successMsgType === "video" && (
                  <div>
                    <label htmlFor="step" className="font-bold text-gray-600">
                      Current Success Message Video
                    </label>
                    <video src={riddleData.successMsgMedia} controls />
                  </div>
                )}
              {riddleData.successMsgMedia &&
                riddleData.successMsgType === "sound" && (
                  <div>
                    <label htmlFor="step" className="font-bold text-gray-600">
                      Current Success Message Audio
                    </label>
                    <audio src={riddleData.successMsgMedia} controls />
                  </div>
                )}
              <label htmlFor="step" className="font-bold text-gray-600">
                Success Message Media
              </label>
              <input {...register("successMsgMedia")} type="file" />
              <div className="h-7 text-red-500">
                {errors.successMsgMedia?.message?.toString()}
              </div>
            </div>
          )}

          <button
            className="my-5 w-fit rounded-full bg-black px-4 py-2 text-white"
            type="submit"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRiddle;
