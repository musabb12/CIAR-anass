import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import SplashScreen from "@/components/common/SplashScreen";
import GenieAssistant from "@/components/genie/GenieAssistant";
import PageTransition from "@/components/common/PageTransition";
import { useFraudShield } from "@/hooks/useFraudShield";
import { useNotificationsBridge } from "@/hooks/useNotificationsBridge";

const ShieldRunner = () => {
  useFraudShield();
  useNotificationsBridge();
  return null;
};

const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SplashScreen />
      <ShieldRunner />
      <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background" dir="rtl">
        <AppSidebar />
        <div className="min-w-0 max-w-full overflow-x-clip">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
      <GenieAssistant />
    </>
  );
};

export default AppShell;
