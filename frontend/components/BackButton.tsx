import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
  text: string;
  link: string;
  className?: string;
}

const BackButton = ({ text, link, className }: BackButtonProps) => {
  return (
    <Link
      href={link}
      className={`${className} text-primary hover:underline inline-flex items-center gap-1 font-bold mb-5`}
    >
      <ChevronLeft size={18} />
      {text}
    </Link>
  );
};

export default BackButton;
