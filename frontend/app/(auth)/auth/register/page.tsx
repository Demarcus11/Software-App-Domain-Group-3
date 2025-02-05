import RegisterForm from "@/components/auth/RegisterForm";
import BackButton from "@/components/BackButton";

const RegisterPage = () => {
  return (
    <>
      <div className="w-wrapper mx-auto">
        <BackButton
          className="px-[1rem]"
          text="Back to login"
          link="/auth/login"
        />
        <div className="max-w-[40rem] mx-auto">
          <RegisterForm />
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
