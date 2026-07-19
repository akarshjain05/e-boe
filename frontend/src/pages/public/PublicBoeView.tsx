import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { boeService } from '@/api/services/billsOfExchange';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function PublicBoeView() {
  const { token } = useParams<{ token: string }>();
  const [hasAccepted, setHasAccepted] = useState(false);
  const [hasRejected, setHasRejected] = useState(false);

  const { data: boe, isLoading, refetch } = useQuery({
    queryKey: ['public-boe', token],
    queryFn: () => boeService.getPublicBillOfExchange(token!),
    enabled: !!token,
    retry: false
  });

  const acceptMutation = useMutation({
    mutationFn: () => boeService.acceptPublicBill(token!),
    onSuccess: () => {
      toast.success('Bill of Exchange accepted successfully');
      setHasAccepted(true);
      refetch();
    },
    onError: () => {
      toast.error('Failed to accept Bill of Exchange');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => boeService.rejectPublicBill(token!),
    onSuccess: () => {
      toast.success('Bill of Exchange rejected');
      setHasRejected(true);
      refetch();
    },
    onError: () => {
      toast.error('Failed to reject Bill of Exchange');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!boe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full text-center py-8">
          <CardContent>
            <FileText className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Found</h2>
            <p className="text-zinc-500">
              The Bill of Exchange you are looking for does not exist or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = boe.status === 'sent' || boe.status === 'issued';
  const showActions = isPending && !hasAccepted && !hasRejected;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bill of Exchange
          </h1>
          <p className="text-zinc-500">
            Drawn by {boe.drawer_name}
          </p>
        </div>

        {/* Status Alert */}
        {(boe.status === 'accepted' || hasAccepted) && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-emerald-800 dark:text-emerald-300">Accepted</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                This Bill of Exchange was accepted on {format(new Date(boe.accepted_at || new Date()), 'PPpp')}.
              </p>
            </div>
          </div>
        )}

        {boe.status === 'rejected' || hasRejected ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">Rejected</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                This Bill of Exchange has been rejected.
              </p>
            </div>
          </div>
        ) : null}

        {/* Main Details Card */}
        <Card>
          <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardDescription>Amount</CardDescription>
                <CardTitle className="text-3xl font-bold">{formatCurrency(boe.amount)}</CardTitle>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <Badge variant="outline" className="w-fit">
                  {boe.status.toUpperCase()}
                </Badge>
                <a 
                  href={`${API_URL}/public/bills-of-exchange/${token}/pdf`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid sm:grid-cols-2 gap-8 pt-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-zinc-500 mb-2">Drawer (Supplier)</h4>
                <p className="font-medium">{boe.drawer_name}</p>
                {boe.drawer_address && <p className="text-sm text-zinc-600 mt-1 whitespace-pre-wrap">{boe.drawer_address}</p>}
              </div>

              <div>
                <h4 className="text-sm font-medium text-zinc-500 mb-2">Drawee (Customer)</h4>
                <p className="font-medium">{boe.drawee_name}</p>
                {boe.drawee_address && <p className="text-sm text-zinc-600 mt-1 whitespace-pre-wrap">{boe.drawee_address}</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-zinc-500 mb-1">Issue Date</h4>
                <p>{format(new Date(boe.issue_date), 'PPP')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-500 mb-1">Due Date</h4>
                <p className="font-medium">{format(new Date(boe.due_date), 'PPP')}</p>
              </div>
              {boe.place_of_issue && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 mb-1">Place of Issue</h4>
                  <p>{boe.place_of_issue}</p>
                </div>
              )}
            </div>
          </CardContent>

          {showActions && (
            <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 border-t p-6 flex flex-col sm:flex-row gap-4 justify-end">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => {
                  if (window.confirm("Are you sure you want to reject this Bill of Exchange?")) {
                    rejectMutation.mutate();
                  }
                }}
                disabled={rejectMutation.isPending || acceptMutation.isPending}
              >
                Reject
              </Button>
              <Button 
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  if (window.confirm("By accepting, you legally agree to pay the stated amount on the due date. Proceed?")) {
                    acceptMutation.mutate();
                  }
                }}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
              >
                {acceptMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Accept Bill of Exchange
              </Button>
            </CardFooter>
          )}
        </Card>
        
        {/* Underlying Invoices */}
        {boe.invoices && boe.invoices.length > 0 && (
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Underlying Invoices</h3>
            <Card>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {boe.invoices.map((inv: any) => (
                  <div key={inv.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Invoice #{inv.bill_id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
