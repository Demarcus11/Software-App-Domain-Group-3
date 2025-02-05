import SecurityQuestionsForm from "@/components/auth/SecurityQuestionsForm";
import BackButton from "@/components/BackButton";

const SecurityQuestionsPage = () => {
  return (
    <>
      <div className="w-wrapper mx-auto">
        <BackButton
          className="px-[1rem]"
          text="Back to forgot password"
          link="/auth/forgot-password"
        />
        <div className="max-w-[40rem] mx-auto">
          <SecurityQuestionsForm />
        </div>
      </div>
    </>
  );
};

export default SecurityQuestionsPage;
