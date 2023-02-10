import Button from "@/shared/components/Button";
import Select from "@/shared/components/Select";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export interface HintProps {
  id: string;
  type: "text" | "audio" | "video" | "image";
  media: string;
  text: string;
}

export interface Riddle {
  id: string;
  name: string;
  answer: string;
  bookId: string;
  successMsgType: string;
  successMsgText: string;
  successMsgMedia: string;
  numberHints: number;
  hints: HintProps[];
  riddleImage: string;
  date: any;
  addedBy: string;
}

export interface RiddleFormProps {
  onSubmit: (data: FormData) => void;
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

const riddleSchema = z.object({
  name: z.string().min(1).max(256),
  answer: z.string().min(1).max(256),
  successMsgType: z.string().min(1).max(256),
  successMsgText: z.string().min(1).max(256).optional(),
  successMsgMedia: z.instanceof(FileList).optional(),
  riddleImage: z.instanceof(FileList).optional(),
});

export type FormData = z.infer<typeof riddleSchema>;

const RiddleForm = ({
  onCancel,
  onSubmit,
  isEdit,
  defaultValues,
}: RiddleFormProps) => {
  const [hints, setHints] = useState<HintProps[]>(defaultValues.hints ?? []);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: defaultValues,
    resolver: zodResolver(riddleSchema),
  });

  const addHint = () => {
    const newHints = [...hints];
    newHints.push({
      text: "Hint Text",
      type: "text",
      media: "",
      id: uuidv4(),
    });

    console.log(newHints);
    setHints(newHints);
  };

  const onTypeChange = (id: string, type: any) => {
    console.log("type", type);
    const newHints = [...hints];
    const index = newHints.findIndex((hint) => hint.id === id);
    newHints[index].type = type;
    console.log(newHints);
    setHints(newHints);
  };

  return (
    <div className="w-full max-w-[750px] py-2 px-4 md:py-5 md:px-10">
      <div className="my-5 text-xl">
        {isEdit ? "Edit Riddle" : "Create New Riddle"}:
      </div>
      <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
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
                  required
                  {...register("name")}
                />

                <div className="h-7 text-red-500">{errors.name?.message}</div>
              </div>
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
                  Riddle Answer
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
            </div>
          </div>
          <div className="flex min-w-[250px] flex-col gap-1">
            Hints
            <div className="flex h-full flex-col gap-5 divide-y-2">
              {hints &&
                hints.map((hint, id) => (
                  <div className="flex flex-col gap-2" key={hint.id}>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-600">
                        Hint {id + 1} Type
                      </label>
                      <div className="w-[150px]">
                        <Select
                          initValue={{
                            value: hint.type,
                            label: hint.type,
                          }}
                          options={typeOptions}
                          onChange={(value) => onTypeChange(hint.id, value)}
                        />
                      </div>

                      {/* <div className="h-7 text-red-500">
                      {errors.hintType?.message}
                    </div> */}
                    </div>

                    {hint.type === "text" ? (
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="step"
                          className="font-bold text-gray-600"
                        >
                          Hint {id + 1} Text
                        </label>
                        <input
                          className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
                          placeholder="Hint Text"
                          required
                        />

                        {/* <div className="h-7 text-red-500">
                        {errors.hintText?.message}
                      </div> */}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="step"
                          className="font-bold text-gray-600"
                        >
                          Hint {id + 1} Media
                        </label>
                        {/* <input {...register("hintMedia")} type="file" />
                      <div className="h-7 text-red-500">
                        {errors.hintMedia?.message}
                      </div> */}
                      </div>
                    )}
                  </div>
                ))}
            </div>
            <div className="my-3 flex flex-col gap-1">
              <Button onClick={addHint} type="button" color={"primary"}>
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
    </div>
  );
};

export default RiddleForm;
