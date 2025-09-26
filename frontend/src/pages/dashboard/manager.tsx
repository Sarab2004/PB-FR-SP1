import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { WarehouseRequests } from "./manager/WarehouseRequests";
import { PurchaseRequests } from "./manager/PurchaseRequests";

const sidebarItems = [{ label: "داشبورد انباردار", to: "/dashboard/manager" }];

const tabs = [
  { key: "warehouse", label: "فرم‌های درخواست کالا" },
  { key: "purchases", label: "فرم‌های درخواست خرید" },
] as const;

type ManagerTab = (typeof tabs)[number]["key"];

export default function ManagerDashboard() {
  const [tab, setTab] = useState<ManagerTab>("warehouse");
  const [focusPurchaseId, setFocusPurchaseId] = useState<string | null>(null);

  function handleConverted(purchaseId?: string) {
    if (purchaseId) {
      setFocusPurchaseId(purchaseId);
      setTab("purchases");
    }
  }

  return (
    <DashboardLayout
      title="داشبورد انباردار"
      subtitle="مدیریت درخواست‌های کالا، تأیید/رد و تبدیل آن‌ها به درخواست خرید"
      sidebarItems={sidebarItems}
      tabs={tabs}
      currentTab={tab}
      onTabChange={(key) => setTab(key as ManagerTab)}
    >
      {tab === "warehouse" ? (
        <WarehouseRequests onConverted={handleConverted} />
      ) : (
        <PurchaseRequests focusId={focusPurchaseId} />
      )}
    </DashboardLayout>
  );
}
