import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import logo from "@/img/logo.png";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <nav className="bg-primary text-white p-4 flex gap-2 items-center mb-20">
        <Image src={logo} alt="AccuBooks" width={50} />
        <p>AccuBooks</p>
      </nav>
      <div className="pb-20">
        {children}
        <Toaster position="top-center" closeButton />
      </div>
    </>
  );
};

export default AuthLayout;
