import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PasswordInput = ({ ...props }: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className="px-3 py-1 text-base shadow-sm border-input border rounded-md"
        type={isVisible ? "text" : "password"}
        {...props}
      />
      {!isVisible ? (
        <Eye
          className="absolute right-4 top-[7px] z-10 cursor-pointer"
          onClick={() => setIsVisible((prev) => !prev)}
          size={25}
        />
      ) : (
        <EyeOff
          className="absolute right-4 top-[7px] z-10 cursor-pointer text-gray-500"
          onClick={() => setIsVisible((prev) => !prev)}
          size={25}
        />
      )}
    </div>
  );
};

export default PasswordInput;
