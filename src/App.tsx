import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./layout/Header";
import Book from "./pages/Book/Book";
import Riddle from "./pages/Book/Riddle/Riddle";
import Home from "./pages/Home/Home";

const App = () => {
  return (
    <div className="flex h-screen w-full justify-center">
      <div className="mb-10 flex w-full max-w-[1880px] flex-col gap-10 px-5 sm:gap-20 sm:px-10 md:gap-24 md:px-16 lg:gap-28 lg:px-20 xl:gap-32 xl:px-24">
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:bookId" element={<Book />} />
            <Route path="/:bookId/:riddleId" element={<Riddle />} />
          </Routes>
        </AuthProvider>

        <Toaster
          position="bottom-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            className: "",
            style: {
              background: "#000",
              color: "#fff",
            },
          }}
        />
      </div>
    </div>
  );
};

export default App;
