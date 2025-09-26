import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { CreateWRequestForm } from "./requester/CreateWRequestForm";
import { MyRequests } from "./requester/MyRequests";

type RequesterTab = "create" | "list";

const sidebarItems = [{ label: "داشبورد درخواست‌کننده", to: "/dashboard/requester" }];

const tabs = [
  { key: "create", label: "فرم درخواست کالا" },
  { key: "list", label: "درخواست‌های من" },
] as const;

export default function RequesterDashboard() {
  const [activeTab, setActiveTab] = useState<RequesterTab>("create");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSuccess() {
    setRefreshKey((prev) => prev + 1);
    setActiveTab("list");
  }

  return (
    <DashboardLayout
      title="داشبورد درخواست‌کننده"
      subtitle="در این بخش می‌توانید فرم درخواست کالا از انبار را تکمیل کنید و وضعیت درخواست‌های ثبت‌شده را دنبال نمایید."
      sidebarItems={sidebarItems}
      tabs={tabs}
      currentTab={activeTab}
      onTabChange={(key) => setActiveTab(key as RequesterTab)}
    >
      {activeTab === "create" ? (
        <CreateWRequestForm onSuccess={handleSuccess} />
      ) : (
        <MyRequests refreshKey={refreshKey} />
      )}
    </DashboardLayout>
  );
}
