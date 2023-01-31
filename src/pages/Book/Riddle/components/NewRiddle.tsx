import { userAuth } from "@/contexts/AuthContext";
import Select from "@/shared/components/Select";
import { db, storage } from "@/utils/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, setDoc, Timestamp } from "firebase/firestore";
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

export interface NewRiddleProps {
  bookId: string;
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
  successMsgMedia: z.instanceof(FileList).optional(),
  hintType: z.string().min(1).max(256),
  hintText: z.string().min(1).max(256).optional(),
  hint2Type: z.string().min(1).max(256),
  hint2Text: z.string().min(1).max(256).optional(),
  hint3Type: z.string().min(1).max(256),
  hint3Text: z.string().min(1).max(256).optional(),
  hintMedia: z.instanceof(FileList).optional(),
  hint2Media: z.instanceof(FileList).optional(),
  hint3Media: z.instanceof(FileList).optional(),
  riddleImage: z.instanceof(FileList),
});

type FormData = z.infer<typeof riddleSchema>;

const NewRiddle = ({ onConfirmed, bookId }: NewRiddleProps) => {
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
      successMsgType: "text",
      hintType: "text",
      hint2Type: "text",
      hint3Type: "text",
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
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const docRef = await addDoc(
          collection(db, "books", bookId, "riddles"),
          {
            name: data.name,
            addedBy: currentUser!.uid,
            date: Timestamp.fromDate(new Date()),
            hintType: data.hintType,
            hintText: data.hintText || "",
            hint2Type: data.hint2Type,
            hint2Text: data.hint2Text || "",
            hint3Type: data.hint3Type,
            hint3Text: data.hint3Text || "",
            successMsgType: data.successMsgType,
            successMsgText: data.successMsgText || "",
            answer: data.answer,
            bookId,
          }
        );
        await uploadFile("riddleImage", data.riddleImage, docRef.id);
        if (data.hintType !== "text") {
          await uploadFile("hintMedia", data.hintMedia, docRef.id);
        }
        if (data.hint2Type !== "text") {
          await uploadFile("hint2Media", data.hint2Media, docRef.id);
        }
        if (data.hint3Type !== "text") {
          await uploadFile("hint3Media", data.hint3Media, docRef.id);
        }
        if (data.successMsgType !== "text") {
          await uploadFile("successMsgMedia", data.successMsgMedia, docRef.id);
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
    <div className="py-5 px-10">
      <div className="my-5 text-xl">Create new riddle:</div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Riddle Image
            </label>
            <input {...register("riddleImage")} type="file" />

            <div className="h-7 text-red-500">
              {errors.riddleImage?.message || ""}
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

            <div className="h-7 text-red-500">{errors.name?.message}</div>
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

            <div className="h-7 text-red-500">{errors.answer?.message}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint 1 Type
            </label>
            <div className="w-[150px]">
              <Select
                options={typeOptions}
                onChange={(value) => onTypeChange(value, "hintType", "hint")}
              />
            </div>

            <div className="h-7 text-red-500">{errors.hintType?.message}</div>
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

              <div className="h-7 text-red-500">{errors.hintText?.message}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 1 Media
              </label>
              <input {...register("hintMedia")} type="file" />
              <div className="h-7 text-red-500">
                {errors.hintMedia?.message}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint 2 Type
            </label>
            <div className="w-[150px]">
              <Select
                options={typeOptions}
                onChange={(value) => onTypeChange(value, "hint2Type", "hint2")}
              />
            </div>

            <div className="h-7 text-red-500">{errors.hint2Type?.message}</div>
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
                {errors.hint2Text?.message}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 2 Media
              </label>
              <input {...register("hint2Media")} type="file" />
              <div className="h-7 text-red-500">
                {errors.hint2Media?.message}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint 3 Type
            </label>
            <div className="w-[150px]">
              <Select
                options={typeOptions}
                onChange={(value) => onTypeChange(value, "hint3Type", "hint3")}
              />
            </div>

            <div className="h-7 text-red-500">{errors.hint3Type?.message}</div>
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
                {errors.hint3Text?.message}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Hint 3 Media
              </label>
              <input {...register("hint3Media")} type="file" />
              <div className="h-7 text-red-500">
                {errors.hint3Media?.message}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Success Message Type
            </label>
            <div className="w-[150px]">
              <Select
                options={typeOptions}
                onChange={(value) =>
                  onTypeChange(value, "successMsgType", "successMsg")
                }
              />
            </div>

            <div className="h-7 text-red-500">
              {errors.successMsgType?.message}
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
                {errors.successMsgText?.message}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor="step" className="font-bold text-gray-600">
                Success Message Media
              </label>
              <input {...register("successMsgMedia")} type="file" />
              <div className="h-7 text-red-500">
                {errors.successMsgMedia?.message}
              </div>
            </div>
          )}

          {/* <div className="h-7 text-red-500">{!isValid && 'An error occured'}</div> */}

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

export default NewRiddle;
