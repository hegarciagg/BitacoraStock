import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme="dark"
      expand={true}
      duration={4000}
      visibleToasts={5}
    />
  );
}
