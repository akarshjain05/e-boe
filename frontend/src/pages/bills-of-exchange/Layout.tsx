import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BillsOfExchangeLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current tab from pathname
  const path = location.pathname;
  let currentTab = "all";
  if (path.includes("/issue")) currentTab = "issue";
  else if (path.includes("/endorse")) currentTab = "endorse";
  else if (path.includes("/discount")) currentTab = "discount";

  const handleTabChange = (value: string) => {
    switch (value) {
      case "all":
        navigate("/bills-of-exchange");
        break;
      case "issue":
        navigate("/bills-of-exchange/issue");
        break;
      case "endorse":
        navigate("/bills-of-exchange/endorse");
        break;
      case "discount":
        navigate("/bills-of-exchange/discount");
        break;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Bills of Exchange</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage, issue, endorse, and discount bills of exchange.</p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
          <TabsTrigger value="all">All Bills</TabsTrigger>
          <TabsTrigger value="issue">Issue Bill</TabsTrigger>
          <TabsTrigger value="endorse">Endorse Bill</TabsTrigger>
          <TabsTrigger value="discount">Discount Bill</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
