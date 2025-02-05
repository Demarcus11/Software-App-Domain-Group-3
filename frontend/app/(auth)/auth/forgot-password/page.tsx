import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import BackButton from "@/components/BackButton";

const ForgotPasswordPage = () => {
  return (
    <>
      <div className="w-wrapper mx-auto">
        <BackButton
          className="px-[1rem]"
          text="Back to login"
          link="/auth/login"
        />
        <div className="max-w-[30rem] mx-auto px-[1rem]">
          <ForgotPasswordForm />
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
