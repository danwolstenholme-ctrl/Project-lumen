export const toast = {
  success(message: string) {
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("lumen-toast", { detail: { message, type: "success" } }));
  },
  error(message: string) {
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("lumen-toast", { detail: { message, type: "error" } }));
  },
};
