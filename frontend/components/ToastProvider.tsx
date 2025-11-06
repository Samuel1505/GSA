"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      toastClassName="!bg-white/5 backdrop-blur-sm !border !border-white/10 !rounded-xl !text-white"
      progressClassName="!bg-gradient-to-r !from-cosmic-purple !to-cosmic-blue"
    />
  );
}

