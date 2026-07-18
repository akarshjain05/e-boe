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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'all', title: 'All Bills', description: 'View all bills of exchange', icon: '📄', path: '/bills-of-exchange' },
          { id: 'issue', title: 'Issue Bill', description: 'Create and send a new bill', icon: '✍️', path: '/bills-of-exchange/issue' },
          { id: 'endorse', title: 'Endorse Bill', description: 'Transfer a bill to someone else', icon: '🤝', path: '/bills-of-exchange/endorse' },
          { id: 'discount', title: 'Discount Bill', description: 'Get early payment from a bank', icon: '💰', path: '/bills-of-exchange/discount' }
        ].map((tab) => (
          <div 
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`cursor-pointer rounded-xl border p-6 transition-all duration-200 hover:shadow-md ${
              currentTab === tab.id 
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-600 dark:ring-indigo-500' 
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{tab.icon}</div>
              <div>
                <h3 className={`font-semibold ${currentTab === tab.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {tab.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {tab.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
