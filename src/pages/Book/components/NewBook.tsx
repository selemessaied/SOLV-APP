import { db } from '@/utils/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { userAuth } from '@/contexts/AuthContext';

export interface NewBookProps {
  onConfirmed: () => void;
}

const bookSchema = z.object({
  name: z.string().min(1).max(256)
});

type FormData = z.infer<typeof bookSchema>;

const NewBook = ({ onConfirmed }: NewBookProps) => {
  const { currentUser } = userAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(bookSchema)
  });
  const onSubmit = (data: FormData) => {
    console.log(data);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        await addDoc(collection(db, 'books'), {
          name: data.name,
          addedBy: currentUser!.uid,
          date: Timestamp.fromDate(new Date())
        });
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

export default NewBook;
