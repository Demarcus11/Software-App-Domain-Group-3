import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import BackButton from "@/components/BackButton";

const ResetPasswordPage = () => {
  return (
    <>
      <div className="w-wrapper mx-auto">
        <BackButton
          className="px-[1rem]"
          text="Back to login"
          link="/auth/login"
        />
        <div className="max-w-[30rem] mx-auto px-[1rem]">
          <ResetPasswordForm />
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
