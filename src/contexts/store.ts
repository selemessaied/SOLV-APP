import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface BookState {
  bookData: any;
  updateBook: (book: any) => void;
}

export const useBookStore = create<BookState>()(
  devtools(
    persist(
      (set) => ({
        bookData: {},
        updateBook: (book: any) => set(() => ({ bookData: book }))
      }),
      {
        name: 'book-storage'
      }
    )
  )
);
