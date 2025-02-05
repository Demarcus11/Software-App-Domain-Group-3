import Navbar from "@/components/dashboard/Navbar";

// TODO: Create and import admin sidebar, conditionally render the admin sidebar based on the user role
// TODO: also look into react state management solutions like Zustand or Redux

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <div className="grid md:grid-cols-[250px_1fr_1fr_1fr] col-span-1 h-screen">
        <div className="hidden md:block">
          <p>Sidebar</p>
        </div>
        <div className="p-5 w-full md:max-w-[1140px] col-start-2 col-end-[-1]">
          {children}
        </div>
      </div>
    </>
  );
};

export default MainLayout;
