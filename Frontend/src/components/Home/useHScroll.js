import { useRef } from "react";

export default function useHScroll() {
  const ref = useRef(null);
  const scroll = (direction) => {
    ref.current?.scrollBy({
      left: direction * ref.current.clientWidth * 0.82,
      behavior: "smooth",
    });
  };

  return [ref, scroll];
}
