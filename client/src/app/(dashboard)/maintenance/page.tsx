'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  StatusBadge,
  paymentStatusVariant,
} from '@/components/ui/status-badge';
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
import {
  CreditCard,
  Loader2,
  Download,
  FileText,
} from 'lucide-react';
import { generateReceiptPDF } from '@/lib/generateReceipt';

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
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

  const [currentMaintenance, setCurrentMaintenance] =
    useState<Maintenance | null>(null);

  const [maintenanceHistory, setMaintenanceHistory] =
    useState<Maintenance[]>([]);

  const [paymentHistory, setPaymentHistory] =
    useState<PaymentLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const [lastPayment, setLastPayment] = useState<{
    transaction_id: string;
    amount: number;
    month: number;
    year: number;
  } | null>(null);

  // --------------------------------------------------
  // Load Razorpay
  // --------------------------------------------------

  useEffect(() => {
    const script = document.createElement('script');

    script.src =
      'https://checkout.razorpay.com/v1/checkout.js';

    script.async = true;

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // --------------------------------------------------
  // Fetch Maintenance Data
  // --------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        currentRes,
        historyRes,
        paymentRes,
      ] = await Promise.all([
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
      console.error(
        'Error fetching maintenance data:',
        error
      );

      toast({
        title: 'Error',
        description:
          'Failed to load maintenance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --------------------------------------------------
  // Pay Now
  // --------------------------------------------------

  const handlePayNow = async (
    maintenance: Maintenance
  ) => {
    if (!window.Razorpay) {
      toast({
        title: 'Error',
        description:
          'Payment system not loaded. Please refresh the page.',
        variant: 'destructive',
      });

      return;
    }

    try {
      setPaying(true);

      const orderRes = await api.post(
        '/maintenance/create-order',
        {
          maintenance_id: maintenance._id,
        }
      );

      if (!orderRes.data.success) {
        throw new Error(
          orderRes.data.message ||
            'Failed to create order'
        );
      }

      const orderData: OrderData =
        orderRes.data.data;

      const options: RazorpayOptions = {
        key: orderData.key_id,

        amount: orderData.amount,

        currency: orderData.currency,

        name: 'Smart Society',

        description: `Maintenance for ${getMonthName(
          orderData.maintenance.month
        )} ${orderData.maintenance.year}`,

        order_id: orderData.order_id,

        handler: async (
          response: RazorpayResponse
        ) => {
          try {
            const verifyRes = await api.post(
              '/payment/verify',
              {
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,

                maintenance_id:
                  maintenance._id,
              }
            );

            if (verifyRes.data.success) {
              setLastPayment({
                transaction_id:
                  response.razorpay_payment_id,

                amount:
                  orderData.maintenance.total_amount,

                month:
                  orderData.maintenance.month,

                year:
                  orderData.maintenance.year,
              });

              setShowSuccess(true);

              await fetchData();

              toast({
                title:
                  'Payment Successful! 🎉',

                description:
                  'Your maintenance payment has been received.',
              });
            } else {
              throw new Error(
                verifyRes.data.message ||
                  'Payment verification failed'
              );
            }
          } catch (error) {
            console.error(
              'Payment verification error:',
              error
            );

            toast({
              title: 'Verification Failed',

              description:
                'Payment received but verification failed. Please contact support.',

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

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (error) {
      console.error(
        'Payment error:',
        error
      );

      toast({
        title: 'Payment Failed',

        description:
          error instanceof Error
            ? error.message
            : 'Failed to initiate payment',

        variant: 'destructive',
      });

      setPaying(false);
    }
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getMonthName = (month: number) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return months[month - 1] || 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // --------------------------------------------------
  // Receipt
  // --------------------------------------------------

  const handleDownloadReceipt = (
    payment: PaymentLog
  ) => {
    generateReceiptPDF({
      transactionId:
        payment.transaction_id,

      amount: payment.amount,

      month: payment.month,

      year: payment.year,

      flatNo: user?.flat_no || '',

      paymentDate:
        payment.payment_date,

      userName:
        user?.name || '',
    });

    toast({
      title: 'Receipt Downloaded',

      description:
        'Your payment receipt has been downloaded successfully.',
    });
  };

  const handleDownloadCurrentReceipt = () => {
    if (!lastPayment) return;

    generateReceiptPDF({
      transactionId:
        lastPayment.transaction_id,

      amount:
        lastPayment.amount,

      month:
        lastPayment.month,

      year:
        lastPayment.year,

      flatNo:
        user?.flat_no || '',

      paymentDate:
        new Date().toISOString(),

      userName:
        user?.name || '',
    });

    toast({
      title: 'Receipt Downloaded',

      description:
        'Your payment receipt has been downloaded successfully.',
    });
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Maintenance
          </h1>

          <p className="text-gray-600 mt-1">
            View and pay your maintenance dues
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-32" />
                <div className="h-12 bg-gray-200 rounded w-24" />
                <div className="h-10 bg-gray-200 rounded w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Maintenance
        </h1>

        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          View and pay your maintenance dues
        </p>
      </div>

      {/* ==================================================
          CURRENT MONTH
      ================================================== */}

      {currentMaintenance && (
        <Card
          className={
            currentMaintenance.status === 'overdue'
              ? 'border-red-200 bg-red-50/50'
              : currentMaintenance.status === 'paid'
              ? 'border-green-200 bg-green-50/50'
              : ''
          }
        >
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg sm:text-xl">
                {getMonthName(
                  currentMaintenance.month
                )}{' '}
                {currentMaintenance.year}
              </CardTitle>

              <div className="self-start sm:self-auto">
                <StatusBadge
                  variant={
                    paymentStatusVariant[
                      currentMaintenance.status
                    ]
                  }
                  dot
                >
                  {currentMaintenance.status ===
                  'paid'
                    ? 'Paid'
                    : currentMaintenance.status ===
                      'overdue'
                    ? 'Overdue'
                    : 'Pending'}
                </StatusBadge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* Amount + Flat */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">
                <p className="text-sm text-gray-500">
                  Total Amount
                </p>

                <p
                  className={`text-3xl sm:text-4xl font-bold ${
                    currentMaintenance.status ===
                    'paid'
                      ? 'text-green-600'
                      : currentMaintenance.status ===
                        'overdue'
                      ? 'text-red-600'
                      : 'text-primary'
                  }`}
                >
                  {formatAmount(
                    currentMaintenance.total_amount
                  )}
                </p>

                {currentMaintenance.late_fee >
                  0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Includes{' '}
                    {formatAmount(
                      currentMaintenance.late_fee
                    )}{' '}
                    late fee
                  </p>
                )}
              </div>

              <div className="sm:text-right">
                <p className="text-sm text-gray-500">
                  Flat No.
                </p>

                <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  {currentMaintenance.flat_no}
                </p>
              </div>

            </div>

            {/* Pending / Overdue */}
            {currentMaintenance.status !==
              'paid' && (
              <div className="flex flex-col gap-4 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Due Date
                  </p>

                  <p
                    className={`font-medium ${
                      currentMaintenance.status ===
                      'overdue'
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {formatDate(
                      currentMaintenance.due_date
                    )}
                  </p>
                </div>

                <Button
                  onClick={() =>
                    handlePayNow(
                      currentMaintenance
                    )
                  }
                  disabled={paying}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>

              </div>
            )}

            {/* Paid */}
            {currentMaintenance.status ===
              'paid' &&
              currentMaintenance.paid_date && (
                <div className="flex items-center gap-2 text-green-600 text-sm pt-3 border-t border-green-200">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>

                  <span>
                    Paid on{' '}
                    {formatDate(
                      currentMaintenance.paid_date
                    )}
                  </span>
                </div>
              )}

          </CardContent>
        </Card>
      )}

      {/* ==================================================
          PAYMENT HISTORY
      ================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>
            Payment History
          </CardTitle>
        </CardHeader>

        <CardContent>

          {maintenanceHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No payment history yet
            </p>
          ) : (
            <>
              {/* ================= MOBILE ================= */}

              <div className="space-y-3 md:hidden">
                {maintenanceHistory.map(
                  (maintenance) => (
                    <div
                      key={maintenance._id}
                      className="rounded-xl border border-gray-200 p-4 bg-white"
                    >

                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {getMonthName(
                              maintenance.month
                            )}{' '}
                            {maintenance.year}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            Flat {maintenance.flat_no}
                          </p>
                        </div>

                        <StatusBadge
                          variant={
                            paymentStatusVariant[
                              maintenance.status
                            ]
                          }
                          dot
                        >
                          {maintenance.status ===
                          'paid'
                            ? 'Paid'
                            : maintenance.status ===
                              'overdue'
                            ? 'Overdue'
                            : 'Pending'}
                        </StatusBadge>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">

                        <div>
                          <p className="text-xs text-gray-500">
                            Amount
                          </p>

                          <p className="font-medium text-gray-900 mt-1">
                            {formatAmount(
                              maintenance.total_amount
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Due Date
                          </p>

                          <p className="font-medium text-gray-900 mt-1">
                            {formatDate(
                              maintenance.due_date
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Paid Date
                          </p>

                          <p className="font-medium text-gray-900 mt-1">
                            {maintenance.paid_date
                              ? formatDate(
                                  maintenance.paid_date
                                )
                              : '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Late Fee
                          </p>

                          <p
                            className={`font-medium mt-1 ${
                              maintenance.late_fee >
                              0
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {formatAmount(
                              maintenance.late_fee
                            )}
                          </p>
                        </div>

                      </div>

                      {maintenance.status !==
                      'paid' ? (
                        <Button
                          size="sm"
                          className="w-full mt-4"
                          onClick={() =>
                            handlePayNow(
                              maintenance
                            )
                          }
                          disabled={paying}
                        >
                          {paying
                            ? 'Processing...'
                            : 'Pay Now'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4 text-blue-600 border-blue-200"
                          onClick={() => {
                            generateReceiptPDF(
                              {
                                transactionId:
                                  maintenance.razorpay_payment_id ||
                                  'N/A',

                                amount:
                                  maintenance.total_amount,

                                month:
                                  maintenance.month,

                                year:
                                  maintenance.year,

                                flatNo:
                                  maintenance.flat_no,

                                paymentDate:
                                  maintenance.paid_date ||
                                  new Date().toISOString(),

                                userName:
                                  user?.name || '',

                                lateFee:
                                  maintenance.late_fee,
                              }
                            );

                            toast({
                              title:
                                'Receipt Downloaded',

                              description:
                                'Your payment receipt has been downloaded.',
                            });
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}

                    </div>
                  )
                )}
              </div>

              {/* ================= DESKTOP ================= */}

              <div className="hidden md:block w-full overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Month
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Due Date
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead className="text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {maintenanceHistory.map(
                      (maintenance) => (
                        <TableRow
                          key={maintenance._id}
                        >
                          <TableCell className="font-medium">
                            {getMonthName(
                              maintenance.month
                            )}{' '}
                            {maintenance.year}
                          </TableCell>

                          <TableCell>
                            {formatAmount(
                              maintenance.total_amount
                            )}

                            {maintenance.late_fee >
                              0 && (
                              <span className="text-xs text-red-600 block">
                                +
                                {formatAmount(
                                  maintenance.late_fee
                                )}{' '}
                                late fee
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {formatDate(
                              maintenance.due_date
                            )}
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              variant={
                                paymentStatusVariant[
                                  maintenance.status
                                ]
                              }
                              dot
                            >
                              {maintenance.status ===
                              'paid'
                                ? 'Paid'
                                : maintenance.status ===
                                  'overdue'
                                ? 'Overdue'
                                : 'Pending'}
                            </StatusBadge>
                          </TableCell>

                          <TableCell className="text-right">
                            {maintenance.status !==
                            'paid' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePayNow(
                                    maintenance
                                  )
                                }
                                disabled={paying}
                              >
                                Pay
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm text-gray-500">
                                  {maintenance.paid_date
                                    ? formatDate(
                                        maintenance.paid_date
                                      )
                                    : ''}
                                </span>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    generateReceiptPDF(
                                      {
                                        transactionId:
                                          maintenance.razorpay_payment_id ||
                                          'N/A',

                                        amount:
                                          maintenance.total_amount,

                                        month:
                                          maintenance.month,

                                        year:
                                          maintenance.year,

                                        flatNo:
                                          maintenance.flat_no,

                                        paymentDate:
                                          maintenance.paid_date ||
                                          new Date().toISOString(),

                                        userName:
                                          user?.name ||
                                          '',

                                        lateFee:
                                          maintenance.late_fee,
                                      }
                                    );

                                    toast({
                                      title:
                                        'Receipt Downloaded',

                                      description:
                                        'Your payment receipt has been downloaded.',
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
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

        </CardContent>
      </Card>

      {/* ==================================================
          TRANSACTION HISTORY
      ================================================== */}

      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 flex-shrink-0" />
              Transaction History
            </CardTitle>
          </CardHeader>

          <CardContent>

            {/* ================= MOBILE ================= */}

            <div className="space-y-3 md:hidden">

              {paymentHistory.map(
                (payment) => (
                  <div
                    key={payment._id}
                    className="rounded-xl border border-gray-200 p-4 bg-white"
                  >

                    <div className="space-y-4">

                      <div>
                        <p className="text-xs text-gray-500">
                          Date
                        </p>

                        <p className="font-medium text-gray-900 mt-1">
                          {formatDate(
                            payment.payment_date
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Transaction ID
                        </p>

                        <p className="font-mono text-xs text-gray-700 mt-1 break-all leading-5">
                          {payment.transaction_id}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">

                        <div>
                          <p className="text-xs text-gray-500">
                            Month
                          </p>

                          <p className="font-medium text-gray-900 mt-1">
                            {getMonthName(
                              payment.month
                            )}{' '}
                            {payment.year}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Amount
                          </p>

                          <p className="font-semibold text-green-600 mt-1">
                            {formatAmount(
                              payment.amount
                            )}
                          </p>
                        </div>

                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200"
                        onClick={() =>
                          handleDownloadReceipt(
                            payment
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF Receipt
                      </Button>

                    </div>

                  </div>
                )
              )}

            </div>

            {/* ================= DESKTOP ================= */}

            <div className="hidden md:block w-full overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Transaction ID
                    </TableHead>

                    <TableHead>
                      Month
                    </TableHead>

                    <TableHead className="text-right">
                      Amount
                    </TableHead>

                    <TableHead className="text-right">
                      Receipt
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paymentHistory.map(
                    (payment) => (
                      <TableRow
                        key={payment._id}
                      >
                        <TableCell>
                          {formatDate(
                            payment.payment_date
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-sm break-all">
                          {payment.transaction_id}
                        </TableCell>

                        <TableCell>
                          {getMonthName(
                            payment.month
                          )}{' '}
                          {payment.year}
                        </TableCell>

                        <TableCell className="text-right text-green-600 font-medium">
                          {formatAmount(
                            payment.amount
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDownloadReceipt(
                                payment
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>

          </CardContent>
        </Card>
      )}

      {/* ==================================================
          PAYMENT SUCCESS DIALOG
      ================================================== */}

      <Dialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-xl">

          <DialogHeader>
            <DialogTitle className="text-center text-xl sm:text-2xl">
              🎉 Payment Successful!
            </DialogTitle>

            <DialogDescription className="text-center">
              Your maintenance payment has been received
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">

            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {lastPayment && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Amount
                  </span>

                  <span className="font-semibold text-green-600">
                    {formatAmount(
                      lastPayment.amount
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Month
                  </span>

                  <span className="font-medium text-right">
                    {getMonthName(
                      lastPayment.month
                    )}{' '}
                    {lastPayment.year}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-gray-500">
                    Transaction ID
                  </span>

                  <span className="font-mono text-xs break-all">
                    {lastPayment.transaction_id}
                  </span>
                </div>

              </div>
            )}

            <p className="text-center text-sm text-gray-500">
              A confirmation email has been sent to{' '}
              {user?.email}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">

              <Button
                variant="outline"
                className="w-full sm:flex-1"
                onClick={
                  handleDownloadCurrentReceipt
                }
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>

              <Button
                className="w-full sm:flex-1"
                onClick={() =>
                  setShowSuccess(false)
                }
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