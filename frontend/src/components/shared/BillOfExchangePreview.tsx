import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { boeService } from '@/api/services/billsOfExchange';
import { formatCurrency } from '@/lib/utils';

export function BillOfExchangePreview({ id }: { id: string }) {
  const { data: boe, isLoading } = useQuery({
    queryKey: ['bills-of-exchange', id],
    queryFn: () => boeService.getBillOfExchange(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!boe) {
    return <div>Bill of Exchange not found.</div>;
  }

  // Helper for rendering rows in details
  const DetailRow = ({ label, value }: { label: string, value?: string }) => (
    <div className="flex mb-1">
      <span className="font-bold w-24 shrink-0">{label}</span>
      <span className="flex-1">{value || '-'}</span>
    </div>
  );

  return (
    <div className="bg-white w-[800px] shadow-2xl border-2 border-black flex flex-col font-serif text-black relative">
      
      {/* Header */}
      <div className="bg-[#8B4513] text-white text-center py-3 border-b-2 border-black">
        <h1 className="text-3xl font-bold tracking-wide">Bill Of Exchange</h1>
      </div>

      {/* Date & Place */}
      <div className="flex justify-end p-2 border-b-2 border-black">
        <div className="border-2 border-black p-2 w-64">
          <div className="flex font-bold">
            <span className="w-16">Date :</span>
            <span>{format(new Date(boe.issue_date), 'dd-MM-yyyy')}</span>
          </div>
          <div className="flex font-bold mt-1">
            <span className="w-16">Place:</span>
            <span>{boe.place_of_issue || '-'}</span>
          </div>
        </div>
      </div>

      {/* Drawer Details Header */}
      <div className="bg-[#D2691E] border-b-2 border-black py-1 px-4">
        <span className="font-bold text-[#8B4513]">Drawer Details :</span>
      </div>

      {/* Drawer Details Content */}
      <div className="p-4 border-b-2 border-black min-h-[120px]">
        <DetailRow label="Name:" value={boe.drawer_name} />
        <DetailRow label="Address:" value={boe.drawer_address} />
        <div className="mt-4">
          <DetailRow label="Phone No.:" value={boe.drawer_phone} />
          <DetailRow label="Email ID:" value={boe.drawer_email} />
        </div>
      </div>

      {/* Amount Header */}
      <div className="bg-[#D2691E] border-b-2 border-black py-1 px-4 flex">
        <span className="font-bold text-[#8B4513] w-24">Amount :</span>
        <span className="font-bold text-black ml-4">₹{formatCurrency(boe.amount)}</span>
      </div>

      {/* Description Content */}
      <div className="p-4 border-b-2 border-black min-h-[150px]">
        <span className="font-bold">Description:</span>
        <p className="mt-2 text-justify indent-8 leading-relaxed">
          {boe.description || `For value received, please pay to the order of ${boe.drawer_name} the sum of Rupees ${formatCurrency(boe.amount)} only.`}
        </p>
      </div>

      {/* Drawee Details Header */}
      <div className="bg-[#D2691E] border-b-2 border-black py-1 px-4">
        <span className="font-bold text-[#8B4513]">Drawee Details:</span>
      </div>

      {/* Drawee Details Content */}
      <div className="p-4 border-b-2 border-black min-h-[120px]">
        <DetailRow label="Name:" value={boe.drawee_name} />
        <DetailRow label="Address:" value={boe.drawee_address} />
        <div className="mt-4">
          <DetailRow label="Phone No.:" value={boe.drawee_phone} />
          <DetailRow label="Email ID:" value={boe.drawee_email} />
        </div>
      </div>

      {/* Issue Details Header */}
      <div className="bg-[#D2691E] border-b-2 border-black py-1 px-4">
        <span className="font-bold text-[#8B4513]">Issue Details:</span>
      </div>

      {/* Issue Details Content */}
      <div className="p-4 border-b-2 border-black min-h-[80px]">
        <div className="flex">
          <span className="font-bold w-40 shrink-0">Due Date:</span>
          <span>{format(new Date(boe.due_date), 'dd-MM-yyyy')}</span>
        </div>
        <div className="flex mt-1">
          <span className="font-bold w-40 shrink-0">Drawn Against Bills:</span>
          <span>{boe.invoices?.length || 0} Invoice(s)</span>
        </div>
      </div>

      {/* Spacer Orange Bar */}
      <div className="bg-[#D2691E] border-b-2 border-black py-2"></div>

      {/* Signatures */}
      <div className="p-8 flex justify-between">
        <div className="border-2 border-black w-64 h-32 flex flex-col justify-end text-center">
          <div className="border-t-2 border-black p-1 text-sm text-[#D2691E] font-medium">
            Drawee seal & Signature
          </div>
        </div>
        
        <div className="border-2 border-black w-64 h-32 flex flex-col justify-end text-center">
          <div className="border-t-2 border-black p-1 text-sm text-[#D2691E] font-medium">
            Drawer seal & Signature
          </div>
        </div>
      </div>
    </div>
  );
}
