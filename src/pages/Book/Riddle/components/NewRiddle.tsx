import { userAuth } from '@/contexts/AuthContext';
import Select from '@/shared/components/Select';
import { db, storage } from '@/utils/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

export interface NewRiddleProps {
  bookId: string;
  onConfirmed: () => void;
}

const typeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Video', value: 'video' },
  { label: 'Image', value: 'image' },
  { label: 'Sound', value: 'sound' }
];

const bookSchema = z.object({
  name: z.string().min(1).max(256),
  answerType: z.string().min(1).max(256),
  answerText: z.string().min(1).max(256).optional(),
  answerMedia: z.instanceof(FileList).optional(),
  hintType: z.string().min(1).max(256),
  hintText: z.string().min(1).max(256).optional(),
  hintMedia: z.instanceof(FileList).optional(),
  riddleImage: z.instanceof(FileList)
});

type FormData = z.infer<typeof bookSchema>;

const NewRiddle = ({ onConfirmed, bookId }: NewRiddleProps) => {
  const { currentUser } = userAuth();

  const {
    register,
    unregister,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormData>({
    defaultValues: {
      answerType: 'text',
      hintType: 'text'
    },
    resolver: zodResolver(bookSchema)
  });

  const onTypeChange = (type: string, input: any) => {
    setValue(input, type);
    const textFieldName = (input + 'Text') as any;
    const mediaFieldName = (input + 'Media') as any;
    if (type === 'text') {
      register(textFieldName);
      unregister(mediaFieldName);
    } else {
      register(mediaFieldName);
      unregister(textFieldName);
    }
  };

  const uploadFile = async (field: string, file: any, id: string) => {
    if (file && file.length) {
      const ext = file[0].name.split('.').pop();
      const storageRef = ref(
        storage,
        `books/${bookId}/riddles/${id}/${field}.${ext}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file[0]);

      const url = new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
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
        doc(db, 'books', bookId, 'riddles', id),
        {
          [field]: DLink
        },
        { merge: true }
      );
    }
  };

  const onSubmit = (data: FormData) => {
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const docRef = await addDoc(
          collection(db, 'books', bookId, 'riddles'),
          {
            name: data.name,
            addedBy: currentUser!.uid,
            date: Timestamp.fromDate(new Date()),
            hintType: data.hintType,
            hintText: data.hintText,
            answerType: data.answerType,
            answerText: data.answerText
          }
        );
        await uploadFile('riddleImage', data.riddleImage, docRef.id);
        resolve();
        onConfirmed();
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });

    toast.promise(promise, {
      loading: 'Loading',
      success: 'Success!',
      error: 'Something went wrong'
    });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-1">
          <label htmlFor="step" className="font-bold text-gray-600">
            Name
          </label>
          <input
            className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
            placeholder="Name"
            required
            {...register('name')}
          />

          <div className="h-7 text-red-500">{errors.name?.message}</div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="step" className="font-bold text-gray-600">
            Hint Type
          </label>
          <div className="w-[150px]">
            <Select
              options={typeOptions}
              onChange={(value) => onTypeChange(value, 'hintType')}
            />
          </div>

          <div className="h-7 text-red-500">{errors.hintType?.message}</div>
        </div>

        {getValues().hintType === 'text' ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint Text
            </label>
            <input
              className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
              placeholder="Hint Text"
              required
              {...register('hintText')}
            />

            <div className="h-7 text-red-500">{errors.hintText?.message}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Hint Media
            </label>
            <input {...register('hintMedia')} type="file" accept="image/*" />
            <div className="h-7 text-red-500">{errors.hintMedia?.message}</div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="step" className="font-bold text-gray-600">
            Answer Type
          </label>
          <div className="w-[150px]">
            <Select
              options={typeOptions}
              onChange={(value) => onTypeChange(value, 'answerType')}
            />
          </div>

          <div className="h-7 text-red-500">{errors.hintType?.message}</div>
        </div>

        {getValues().answerType === 'text' ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Answer Text
            </label>
            <input
              className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
              placeholder="Answer Text"
              required
              {...register('answerText')}
            />

            <div className="h-7 text-red-500">{errors.answerText?.message}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="step" className="font-bold text-gray-600">
              Answer Media
            </label>
            <input {...register('answerMedia')} type="file" accept="image/*" />
            <div className="h-7 text-red-500">
              {errors.answerMedia?.message}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="step" className="font-bold text-gray-600">
            Riddle Image
          </label>
          <input {...register('riddleImage')} type="file" accept="image/*" />

          <div className="h-7 text-red-500">
            {errors.riddleImage?.message || ''}
          </div>
        </div>

        <div className="h-7 text-red-500">{!isValid && 'An error occured'}</div>

        {/* <div>{errors && JSON.stringify(errors)}</div> */}

        <button
          className="rounded-full w-fit my-5 bg-black px-4 py-2 text-white"
          type="submit"
        >
          Continue
        </button>
      </div>
    </form>
  );
};

export default NewRiddle;
