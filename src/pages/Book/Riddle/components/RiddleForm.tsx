import Button from "@/shared/components/Button";
import Select from "@/shared/components/Select";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase/firestore";
import MediaCheck from "./MediaCheck";

// const MAX_FILE_SIZE = 500000;
// const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// const RegistrationSchema = z.object({
//   profileImage: z
//     .any()
//     .refine((files) => files?.length === 0, "Image is required.") // if no file files?.length === 0, if file files?.length === 1
//     .refine((files) => files?.[0]?.size >= MAX_FILE_SIZE, `Max file size is 5MB.`) // this should be greater than or equals (>=) not less that or equals (<=)
//     .refine(
//       (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
//       ".jpg, .jpeg, .png and .webp files are accepted."
//     ),
// });

export interface RiddleFormProps {
  onSubmit: (data: FormData, dirtyFields: any, hintState: any) => void;
  onCancel: () => void;
  defaultValues: any;
  isEdit: boolean;
}

const typeOptions = [
  { label: "Text", value: "text" },
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
  { label: "Audio", value: "audio" },
];

const riddleSchema = z
  .object({
    id: z.string().max(256).optional(),
    bookId: z.string().max(256).optional(),
    name: z.string().min(1).max(256),
    answer: z.string().min(1).max(256),
    successMsgType: z.string().max(256),
    successMsgText: z.string().max(256).optional(),
    successMsgMedia: z.any().optional(),
    riddleImage: z.any(),
    hints: z.array(
      z.object({
        id: z.string().max(256).optional(),
        type: z.enum(["text", "video", "image", "audio"]),
        media: z.any(),
        text: z.string().min(0).max(256).optional(),
        order: z.number().optional(),
      })
    ),
    date: z.instanceof(Timestamp).optional(),
    addedBy: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.riddleImage.length === 0) {
      ctx.addIssue({
        path: ["riddleImage"],
        message: "Riddle image required",
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.hints.length > 0) {
      data.hints.map((hint, index) => {
        if (hint.media?.length === 0 && hint.type !== "text") {
          ctx.addIssue({
            message: "Hint media required",
            code: z.ZodIssueCode.custom,
            path: ["hints", index, "media"],
          });
        }
        if (!hint.text && hint.type === "text") {
          ctx.addIssue({
            message: "Hint text required",
            code: z.ZodIssueCode.custom,
            path: ["hints", index, "text"],
          });
        }
      });
    }

    if (data.successMsgMedia?.length === 0 && data.successMsgType !== "text") {
      ctx.addIssue({
        message: "Success message media required",
        code: z.ZodIssueCode.custom,
        path: ["successMsgMedia"],
      });
    }
    if (!data.successMsgText && data.successMsgType === "text") {
      ctx.addIssue({
        message: "Success message text required",
        code: z.ZodIssueCode.custom,
        path: ["successMsgText"],
      });
    }
  });

export type FormData = z.infer<typeof riddleSchema>;

const RiddleForm = ({
  onCancel,
  onSubmit,
  isEdit,
  defaultValues,
}: RiddleFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    getFieldState,
    control,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    defaultValues: defaultValues,
    resolver: zodResolver(riddleSchema),
  });

  const onSub = (data: any) => {
    const hintState = getFieldState("hints");
    if (data.hints?.length > 0) {
      let index = 0;
      for (const hint of data.hints) {
        index++;
        hint.order = index;
      }
    }
    onSubmit(data, dirtyFields, hintState);
  };

  // watch(() => {
  //   console.log("errors", errors);
  //   console.log("dirty", dirtyFields);
  // });

  const { fields, append, update, remove } = useFieldArray({
    name: "hints",
    control,
  });

  const emptyHint: any = {
    text: "",
    type: "text",
    id: uuidv4(),
  };

  const onSuccessTypeChange = (type: any) => {
    setValue("successMsgType", type);
  };

  return (
    <div className="w-full max-w-[750px] py-2 px-4 md:py-5 md:px-10">
      <>
        <div className="my-5 text-xl">
          {isEdit ? "Edit Riddle" : "Create New Riddle"}:
        </div>
        <form className="w-full" onSubmit={handleSubmit(onSub)}>
          <div className="grid w-full grid-cols-1 md:grid-cols-2">
            <div className="flex min-w-[250px] flex-col gap-1">
              <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Riddle Name
                  </label>
                  <input
                    className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                    placeholder="Name"
                    {...register("name")}
                  />

                  <div className="h-7 text-red-500">{errors.name?.message}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Riddle Image
                  </label>
                  {isEdit && typeof getValues("riddleImage") === "string" && (
                    <img className="h-32 w-32" src={getValues("riddleImage")} />
                  )}
                  <input {...register("riddleImage")} type="file" />

                  <div className="h-7 text-red-500">
                    {errors.riddleImage?.message?.toString()}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Riddle Answer
                  </label>
                  <input
                    className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                    placeholder="Answer"
                    {...register("answer")}
                  />

                  <div className="h-7 text-red-500">
                    {errors.answer?.message}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="step" className="font-bold text-gray-600">
                    Success Message Type
                  </label>
                  <div className="w-[150px]">
                    <Select
                      initValue={{
                        value: defaultValues.successMsgType ?? "text",
                        label: defaultValues.successMsgType ?? "text",
                      }}
                      options={typeOptions}
                      onChange={(value) => onSuccessTypeChange(value)}
                    />
                  </div>

                  <div className="h-7 text-red-500">
                    {errors.successMsgType?.message}
                  </div>
                </div>

                {watch("successMsgType") === "text" ? (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="step" className="font-bold text-gray-600">
                      Success Message Text
                    </label>
                    <input
                      className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                      placeholder="Hint Text"
                      {...register("successMsgText", {
                        shouldUnregister: true,
                      })}
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
                    {isEdit && typeof watch("successMsgMedia") === "string" && (
                      <MediaCheck
                        media={getValues("successMsgMedia")}
                        type={defaultValues.successMsgType}
                        label={"Success Message"}
                        index={1}
                      />
                    )}
                    <input
                      {...register("successMsgMedia", {
                        shouldUnregister: true,
                      })}
                      type="file"
                    />
                    <div className="h-7 text-red-500">
                      {errors.successMsgMedia?.message?.toString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex min-w-[250px] flex-col gap-1">
              Hints
              <div className="flex h-full flex-col gap-5 divide-y-2">
                {fields &&
                  fields.map((hint, index) => (
                    <div className="flex flex-col gap-2" key={hint.id}>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-gray-600">
                          Hint {index + 1} Type
                        </label>
                        <div className="w-[150px]">
                          <Select
                            initValue={{
                              value: hint.type,
                              label: hint.type,
                            }}
                            options={typeOptions}
                            onChange={(value: any) =>
                              update(index, { ...hint, type: value })
                            }
                          />
                        </div>

                        <div className="h-7 text-red-500">
                          {errors.hints?.[index]?.message}
                        </div>
                      </div>

                      {hint.type === "text" ? (
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="step"
                            className="font-bold text-gray-600"
                          >
                            Hint {index + 1} Text
                          </label>
                          <input
                            className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                            placeholder="Hint Text"
                            {...register(`hints.${index}.text`, {
                              shouldUnregister: true,
                            })}
                          />

                          <div className="h-7 text-red-500">
                            {errors.hints?.[index]?.text?.message}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="step"
                            className="font-bold text-gray-600"
                          >
                            Hint {index + 1} Media
                          </label>
                          {isEdit &&
                            typeof watch(`hints.${index}.media`) ===
                              "string" && (
                              <MediaCheck
                                media={getValues(`hints.${index}.media`)}
                                type={getValues(`hints.${index}.type`)}
                                label={`Hint ${index}`}
                                index={index}
                              />
                            )}
                          <input
                            {...register(`hints.${index}.media`, {
                              shouldUnregister: true,
                            })}
                            type="file"
                          />
                          <div className="h-7 text-red-500">
                            {errors.hints?.[index]?.media?.message?.toString()}
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={() => remove(index)}
                        type="button"
                        color="red"
                      >
                        <div className="flex items-center justify-center gap-3 text-white">
                          <TrashIcon className="h-6" />
                          <span>Remove hint</span>
                        </div>
                      </Button>
                    </div>
                  ))}
              </div>
              <div className="my-3 flex flex-col gap-1">
                <Button
                  onClick={() => append(emptyHint)}
                  type="button"
                  color={"primary"}
                >
                  <div className="flex items-center justify-center gap-3">
                    <PlusCircleIcon className="h-6 text-white" />
                    <span>Add hint</span>
                  </div>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  className="my-5 w-fit rounded-full bg-black px-4 py-2 text-white"
                  type="submit"
                >
                  Continue
                </button>
                <button
                  className="my-5 w-fit rounded-full bg-zinc-100 px-4 py-2 text-black"
                  type="button"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </>
    </div>
  );
};

export default RiddleForm;
