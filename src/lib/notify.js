import { toast } from "sonner";

export const notify = {
  success: (message, opts) => toast.success(message, opts),
  error: (message, opts) => toast.error(message, opts),
  info: (message, opts) => toast.info(message, opts),
};
