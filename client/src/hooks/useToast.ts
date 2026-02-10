import { toast } from "sonner";

export function useToast() {
  return {
    success: (message: string, description?: string) => {
      toast.success(message, {
        description,
      });
    },
    error: (message: string, description?: string) => {
      toast.error(message, {
        description,
      });
    },
    loading: (message: string) => {
      return toast.loading(message);
    },
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      }
    ) => {
      return toast.promise(promise, messages);
    },
    dismiss: (toastId?: string | number) => {
      toast.dismiss(toastId);
    },
  };
}
