'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, paymentStatusVariant } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Maintenance, PaymentLog } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Loader2, Download, FileText } from 'lucide-react';
import { generateReceiptPDF } from '@/lib/generateReceipt';

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface OrderData {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  maintenance: {
    id: string;
    month: number;
    year: number;
    flat_no: string;
    total_amount: number;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentMaintenance, setCurrentMaintenance] = useState<Maintenance | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<Maintenance[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    transaction_id: string;
    amount: number;
    month: number;
    year: number;
  } | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [currentRes, historyRes, paymentRes] = await Promise.all([
        api.get('/maintenance/current'),
        api.get('/maintenance?status='),
        api.get('/maintenance/history'),
      ]);

      if (currentRes.data.success) {
        setCurrentMaintenance(currentRes.data.data);
      }
      if (historyRes.data.success) {
        setMaintenanceHistory(historyRes.data.data);
      }
      if (paymentRes.data.success) {
        setPaymentHistory(paymentRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load maintenance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayNow = async (maintenance: Maintenance) => {
    if (!window.Razorpay) {
      toast({
        title: 'Error',
        description: 'Payment system not loaded. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPaying(true);
      
      // Create order
      const orderRes = await api.post('/maintenance/create-order', {
        maintenance_id: maintenance._id,
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create order');
      }

      const orderData: OrderData = orderRes.data.data;

      // Configure Razorpay
      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Rajarshi Darshan Society',
        description: `Maintenance for ${getMonthName(orderData.maintenance.month)} ${orderData.maintenance.year}`,
        order_id: orderData.order_id,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              maintenance_id: maintenance._id,
            });

            if (verifyRes.data.success) {
              setLastPayment({
                transaction_id: response.razorpay_payment_id,
                amount: orderData.maintenance.total_amount,
                month: orderData.maintenance.month,
                year: orderData.maintenance.year,
              });
              setShowSuccess(true);
              fetchData(); // Refresh data
              toast({
                title: 'Payment Successful! 🎉',
                description: 'Your maintenance payment has been received.',
              });
            } else {
              throw new Error(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: 'Verification Failed',
              description: 'Payment received but verification failed. Please contact support.',
              variant: 'destructive',
            });
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: orderData.prefill.name,
          email: orderData.prefill.email,
          contact: orderData.prefill.contact,
        },
        theme: {
          color: '#0D9488',
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Failed to initiate payment',
        variant: 'destructive',
      });
      setPaying(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadReceipt = (payment: PaymentLog) => {
    generateReceiptPDF({
      transactionId: payment.transaction_id,
      amount: payment.amount,
      month: payment.month,
      year: payment.year,
      flatNo: user?.flat_no || '',
      paymentDate: payment.payment_date,
      userName: user?.name || '',
    });
    
    toast({
      title: 'Receipt Downloaded',
      description: 'Your payment receipt has been downloaded successfully.',
    });
  };

  const handleDownloadCurrentReceipt = () => {
    if (lastPayment) {
      generateReceiptPDF({
        transactionId: lastPayment.transaction_id,
        amount: lastPayment.amount,
        month: lastPayment.month,
        year: lastPayment.year,
        flatNo: user?.flat_no || '',
        paymentDate: new Date().toISOString(),
        userName: user?.name || '',
      });
      
      toast({
        title: 'Receipt Downloaded',
        description: 'Your payment receipt has been downloaded successfully.',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-1">View and pay your maintenance dues</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="h-12 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
        <p className="text-gray-600 mt-1">View and pay your maintenance dues</p>
      </div>

      {/* Current Month Card */}
      {currentMaintenance && (
        <Card className={currentMaintenance.status === 'overdue' ? 'border-red-200 bg-red-50/50' : currentMaintenance.status === 'paid' ? 'border-green-200 bg-green-50/50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {getMonthName(currentMaintenance.month)} {currentMaintenance.year}
              </CardTitle>
              <StatusBadge variant={paymentStatusVariant[currentMaintenance.status]} dot>
                {currentMaintenance.status === 'paid' ? 'Paid' : currentMaintenance.status === 'overdue' ? 'Overdue' : 'Pending'}
              </StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className={`text-3xl font-bold ${
                  currentMaintenance.status === 'paid' ? 'text-green-600' : 
                  currentMaintenance.status === 'overdue' ? 'text-red-600' : 'text-primary'
                }`}>
                  {formatAmount(currentMaintenance.total_amount)}
                </p>
                {currentMaintenance.late_fee > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Includes {formatAmount(currentMaintenance.late_fee)} late fee
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Flat No.</p>
                <p className="text-2xl font-semibold text-gray-900">{currentMaintenance.flat_no}</p>
              </div>
            </div>

            {currentMaintenance.status !== 'paid' && (
              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className={`font-medium ${currentMaintenance.status === 'overdue' ? 'text-red-600' : ''}`}>
                    {formatDate(currentMaintenance.due_date)}
                  </p>
                </div>
                <Button 
                  onClick={() => handlePayNow(currentMaintenance)}
                  disabled={paying}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                    </>
                  )}
                </Button>
              </div>
            )}

            {currentMaintenance.status === 'paid' && currentMaintenance.paid_date && (
              <div className="flex items-center gap-2 text-green-600 text-sm pt-2 border-t">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Paid on {formatDate(currentMaintenance.paid_date)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payment history yet</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceHistory.map((maintenance) => (
                  <TableRow key={maintenance._id}>
                    <TableCell className="font-medium">
                      {getMonthName(maintenance.month)} {maintenance.year}
                    </TableCell>
                    <TableCell>
                      {formatAmount(maintenance.total_amount)}
                      {maintenance.late_fee > 0 && (
                        <span className="text-xs text-red-600 block">
                          +{formatAmount(maintenance.late_fee)} late fee
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(maintenance.due_date)}</TableCell>
                    <TableCell>
                      <StatusBadge variant={paymentStatusVariant[maintenance.status]} dot>
                        {maintenance.status === 'paid' ? 'Paid' : maintenance.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      {maintenance.status !== 'paid' ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePayNow(maintenance)}
                          disabled={paying}
                        >
                          Pay
                        </Button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-gray-500">
                            {maintenance.paid_date && formatDate(maintenance.paid_date)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              generateReceiptPDF({
                                transactionId: maintenance.razorpay_payment_id || 'N/A',
                                amount: maintenance.total_amount,
                                month: maintenance.month,
                                year: maintenance.year,
                                flatNo: maintenance.flat_no,
                                paymentDate: maintenance.paid_date || new Date().toISOString(),
                                userName: user?.name || '',
                                lateFee: maintenance.late_fee,
                              });
                              toast({
                                title: 'Receipt Downloaded',
                                description: 'Your payment receipt has been downloaded.',
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.transaction_id}
                    </TableCell>
                    <TableCell>
                      {getMonthName(payment.month)} {payment.year}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatAmount(payment.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Payment Successful!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your maintenance payment has been received
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {lastPayment && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-green-600">
                    {formatAmount(lastPayment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Month</span>
                  <span className="font-medium">
                    {getMonthName(lastPayment.month)} {lastPayment.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-sm">{lastPayment.transaction_id}</span>
                </div>
              </div>
            )}
            
            <p className="text-center text-sm text-gray-500">
              A confirmation email has been sent to {user?.email}
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1" 
                onClick={handleDownloadCurrentReceipt}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => setShowSuccess(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
