import { useState, useEffect, useRef, InputHTMLAttributes } from "react";
import { Input } from "./input";

interface MultiCharInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  length: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function MultiCharInput({
  length,
  value,
  onChange,
  disabled,
  ...props
}: MultiCharInputProps) {
  const [letters, setLetters] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setLetters(value.split("").concat(Array(length - value.length).fill("")));
  }, [value, length]);

  const handleChange = (idx: number, val: string) => {
    const newLetters = [...letters];
    newLetters[idx] = val.toUpperCase().slice(-1);
    setLetters(newLetters);
    onChange(newLetters.join(""));

    if (val && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (props.onKeyDown) props.onKeyDown(e);

    if (e.key === "Backspace") {
      if (letters[idx]) {
        const newLetters = [...letters];
        newLetters[idx] = "";
        setLetters(newLetters);
        onChange(newLetters.join(""));
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handleFocus = (idx: number) => {
    setLetters((letters) => {
      const newLetters = [...letters];

      // Clear all letters from the focused input onwards
      for (let i = idx; i < length; i++) {
        newLetters[i] = "";
      }

      // Find the first empty input and focus it
      const firstEmptyIndex = newLetters.findIndex((l) => l === "");
      if (firstEmptyIndex !== -1) {
        inputRefs.current[firstEmptyIndex]?.focus();
      }

      return newLetters;
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, idx: number) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/\s+/g, "");
    if (!pasted) return;

    const newLetters = [...letters];

    for (let i = 0; i < pasted.length && idx + i < length; i++) {
      newLetters[idx + i] = pasted[i];
    }

    setLetters(newLetters);
    onChange(newLetters.join(""));

    const nextIndex = idx + pasted.length;
    if (nextIndex < length) {
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex flex-wrap">
      {letters.map((letter, idx) => (
        <Input
          key={idx}
          ref={(el) => { (inputRefs.current[idx] = el) }}
          type="text"
          maxLength={1}
          value={letter}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onFocus={() => handleFocus(idx)}
          onPaste={(e) => handlePaste(e, idx)}
          style={{ caretColor: "transparent", width: `calc(100%/${length})`, textAlign: "center" }}
          {...props}
        />
      ))}
    </div>
  );
}
