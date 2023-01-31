import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface BookState {
  bookData: any;
  riddleData: any;
  updateBook: (book: any) => void;
  updateRiddle: (riddle: any) => void;
}

export const useBookStore = create<BookState>()(
  devtools(
    persist(
      (set) => ({
        bookData: {},
        updateBook: (book: any) => set(() => ({ bookData: book })),
        riddleData: {},
        updateRiddle: (riddle: any) => set(() => ({ riddleData: riddle }))
      }),
      {
        name: 'book-storage'
      }
    )
  )
);
