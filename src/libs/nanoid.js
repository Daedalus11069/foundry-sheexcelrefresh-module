import { nanoid, customAlphabet } from "nanoid";

const useId = () => {
  return (
    customAlphabet(
      "abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz".toUpperCase(),
      1
    )() + nanoid()
  );
};

export { useId as nanoid };
