import { userAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/utils/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { any, z } from 'zod';

export interface NewRiddleProps {
  bookId: string;
  onConfirmed: () => void;
}

const bookSchema = z.object({
  name: z.string().min(1).max(256),
  answer: z.string().min(1).max(256),
  hint: z.string().min(1).max(256),
  img: z.optional(any())
});

type FormData = z.infer<typeof bookSchema>;

const NewRiddle = ({ onConfirmed, bookId }: NewRiddleProps) => {
  const { currentUser } = userAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(bookSchema)
  });

  const uploadFile = async (file: File, id: string) => {
    if (file && file.length) {
      console.log('file', file);
      const ext = file[0].name.split('.').pop();
      const storageRef = ref(
        storage,
        `books/${bookId}/riddles/${id}/image.${ext}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

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
          ['Img']: DLink
        },
        { merge: true }
      );
    }
  };

  const onSubmit = (data: FormData) => {
    console.log(data);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const docRef = await addDoc(
          collection(db, 'books', bookId, 'riddles'),
          {
            name: data.name,
            addedBy: currentUser!.uid,
            date: Timestamp.fromDate(new Date()),
            hint: data.hint,
            answer: data.answer
          }
        );
        await uploadFile(data.img, docRef.id);
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
      <div className="flex w-[540px] flex-col gap-1">
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
            Hint
          </label>
          <input
            className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
            placeholder="Hint"
            required
            {...register('hint')}
          />

          <div className="h-7 text-red-500">{errors.hint?.message}</div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="step" className="font-bold text-gray-600">
            Answer
          </label>
          <input
            className="border-1 w-[250px] rounded-md border border-gray-300 bg-zinc-50 p-[15px] outline-none"
            placeholder="Answer"
            required
            {...register('answer')}
          />

          <div className="h-7 text-red-500">{errors.answer?.message}</div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="step" className="font-bold text-gray-600">
            Image
          </label>
          <input
            {...register('img')}
            onChange={(e) => console.log(e)}
            type="file"
            accept="image/*"
          />

          {/*  <div className="h-7 text-red-500">{errors.img?.message || ''}</div> */}
        </div>

        <button
          className="rounded-full w-fit bg-black px-4 py-2 text-white"
          type="submit"
        >
          Continue
        </button>
      </div>
    </form>
  );
};

export default NewRiddle;
