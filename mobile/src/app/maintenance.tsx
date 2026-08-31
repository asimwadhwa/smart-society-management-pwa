import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type Maintenance = {
  _id: string;
  month: number;
  year: number;
  flat_no: string;
  total_amount: number;
  late_fee: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_date?: string;
  razorpay_payment_id?: string;
};

type PaymentLog = {
  _id: string;
  transaction_id: string;
  amount: number;
  month: number;
  year: number;
  payment_date: string;
};

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

export default function MaintenanceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [currentMaintenance] = useState<Maintenance>({
    _id: '1',
    month: 8,
    year: 2026,
    flat_no: '101',
    total_amount: 1000,
    late_fee: 0,
    status: 'paid',
    due_date: '2026-08-18',
    paid_date: '2026-08-26',
    razorpay_payment_id: 'pay_TUMfcRttfQNiLq',
  });

  const [maintenanceHistory] = useState<Maintenance[]>([
    {
      _id: '1',
      month: 8,
      year: 2026,
      flat_no: '101',
      total_amount: 1000,
      late_fee: 0,
      status: 'paid',
      due_date: '2026-08-18',
      paid_date: '2026-08-26',
      razorpay_payment_id: 'pay_TUMfcRttfQNiLq',
    },
  ]);

  const [paymentHistory] = useState<PaymentLog[]>([
    {
      _id: '1',
      transaction_id: 'pay_TUMfcRttfQNiLq',
      amount: 1000,
      month: 8,
      year: 2026,
      payment_date: '2026-08-26',
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getMonthName = (month: number) => {
    return months[month - 1] || 'Unknown';
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);

    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusText = (status: string) => {
    if (status === 'paid') return 'Paid';
    if (status === 'overdue') return 'Overdue';
    return 'Pending';
  };

  const handlePayNow = () => {
    Alert.alert(
      'Payment',
      'Razorpay mobile payment integration will be connected in the next step.'
    );
  };

  const handleDownloadReceipt = () => {
    Alert.alert(
      'Receipt',
      'PDF receipt download will be connected in the next step.'
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>
          Loading Maintenance...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Maintenance
          </Text>

          <Text style={styles.headerSubtitle}>
            View and pay your maintenance dues
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >

        {/* Current Maintenance */}
        <View
          style={[
            styles.currentCard,
            currentMaintenance.status === 'paid'
              ? styles.paidCard
              : currentMaintenance.status === 'overdue'
              ? styles.overdueCard
              : styles.pendingCard,
          ]}
        >

          <View style={styles.cardTopRow}>
            <Text style={styles.monthTitle}>
              {getMonthName(currentMaintenance.month)}{' '}
              {currentMaintenance.year}
            </Text>

            <View
              style={[
                styles.statusBadge,
                currentMaintenance.status === 'paid'
                  ? styles.paidBadge
                  : currentMaintenance.status === 'overdue'
                  ? styles.overdueBadge
                  : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  currentMaintenance.status === 'paid'
                    ? styles.paidText
                    : currentMaintenance.status === 'overdue'
                    ? styles.overdueText
                    : styles.pendingText,
                ]}
              >
                ● {getStatusText(currentMaintenance.status)}
              </Text>
            </View>
          </View>

          <View style={styles.amountRow}>

            <View style={styles.amountContainer}>
              <Text style={styles.label}>
                Total Amount
              </Text>

              <Text style={styles.amount}>
                {formatAmount(currentMaintenance.total_amount)}
              </Text>
            </View>

            <View style={styles.flatContainer}>
              <Text style={styles.label}>
                Flat No.
              </Text>

              <Text style={styles.flatNumber}>
                {currentMaintenance.flat_no}
              </Text>
            </View>

          </View>

          {currentMaintenance.status === 'paid' &&
            currentMaintenance.paid_date && (
              <View style={styles.paidInfo}>
                <Text style={styles.checkIcon}>✓</Text>

                <Text style={styles.paidInfoText}>
                  Paid on {formatDate(currentMaintenance.paid_date)}
                </Text>
              </View>
            )}

          {currentMaintenance.status !== 'paid' && (
            <View style={styles.paymentSection}>

              <View style={styles.dueContainer}>
                <Text style={styles.label}>
                  Due Date
                </Text>

                <Text style={styles.dueDate}>
                  {formatDate(currentMaintenance.due_date)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayNow}
              >
                <Text style={styles.payButtonText}>
                  💳 Pay Now
                </Text>
              </TouchableOpacity>

            </View>
          )}

        </View>

        {/* Payment History */}
        <View style={styles.sectionCard}>

          <Text style={styles.sectionTitle}>
            Payment History
          </Text>

          {maintenanceHistory.map((maintenance) => (

            <View
              key={maintenance._id}
              style={styles.historyCard}
            >

              <View style={styles.historyHeader}>

                <Text style={styles.historyMonth}>
                  {getMonthName(maintenance.month)}{' '}
                  {maintenance.year}
                </Text>

                <View
                  style={[
                    styles.smallBadge,
                    maintenance.status === 'paid'
                      ? styles.paidBadge
                      : maintenance.status === 'overdue'
                      ? styles.overdueBadge
                      : styles.pendingBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.smallBadgeText,
                      maintenance.status === 'paid'
                        ? styles.paidText
                        : maintenance.status === 'overdue'
                        ? styles.overdueText
                        : styles.pendingText,
                    ]}
                  >
                    {getStatusText(maintenance.status)}
                  </Text>
                </View>

              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount</Text>

                <Text style={styles.infoValue}>
                  {formatAmount(maintenance.total_amount)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date</Text>

                <Text style={styles.infoValue}>
                  {formatDate(maintenance.due_date)}
                </Text>
              </View>

              {maintenance.paid_date && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    Paid Date
                  </Text>

                  <Text style={styles.infoValue}>
                    {formatDate(maintenance.paid_date)}
                  </Text>
                </View>
              )}

              {maintenance.status !== 'paid' ? (
                <TouchableOpacity
                  style={styles.fullButton}
                  onPress={handlePayNow}
                >
                  <Text style={styles.fullButtonText}>
                    Pay Now
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={handleDownloadReceipt}
                >
                  <Text style={styles.outlineButtonText}>
                    ↓ Download Receipt
                  </Text>
                </TouchableOpacity>
              )}

            </View>
          ))}

        </View>

        {/* Transaction History */}
        {paymentHistory.length > 0 && (
          <View style={styles.sectionCard}>

            <View style={styles.transactionTitleRow}>
              <Text style={styles.documentIcon}>
                📄
              </Text>

              <Text style={styles.sectionTitle}>
                Transaction History
              </Text>
            </View>

            {paymentHistory.map((payment) => (

              <View
                key={payment._id}
                style={styles.transactionCard}
              >

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    Date
                  </Text>

                  <Text style={styles.infoValue}>
                    {formatDate(payment.payment_date)}
                  </Text>
                </View>

                {/* Transaction ID */}
                <View style={styles.transactionIdContainer}>
                  <Text style={styles.infoLabel}>
                    Transaction ID
                  </Text>

                  <Text
                    style={styles.transactionId}
                    selectable
                  >
                    {payment.transaction_id}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    Month
                  </Text>

                  <Text style={styles.infoValue}>
                    {getMonthName(payment.month)}{' '}
                    {payment.year}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    Amount
                  </Text>

                  <Text style={styles.transactionAmount}>
                    {formatAmount(payment.amount)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={handleDownloadReceipt}
                >
                  <Text style={styles.outlineButtonText}>
                    ↓ Download PDF Receipt
                  </Text>
                </TouchableOpacity>

              </View>
            ))}

          </View>
        )}

        <View style={{ height: 40 }} />

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },

  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    flexShrink: 1,
  },

  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginLeft: 8,
  },

  backText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 30,
  },

  currentCard: {
    width: '100%',
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    marginBottom: 14,
  },

  paidCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },

  overdueCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },

  pendingCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  monthTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
  },

  paidBadge: {
    backgroundColor: '#dcfce7',
  },

  overdueBadge: {
    backgroundColor: '#fee2e2',
  },

  pendingBadge: {
    backgroundColor: '#dbeafe',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  paidText: {
    color: '#16a34a',
  },

  overdueText: {
    color: '#dc2626',
  },

  pendingText: {
    color: '#2563eb',
  },

  amountRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  amountContainer: {
    flex: 1,
  },

  flatContainer: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },

  label: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },

  amount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#16a34a',
  },

  flatNumber: {
    fontSize: 27,
    fontWeight: '700',
    color: '#0f172a',
  },

  paymentSection: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dueContainer: {
    flex: 1,
  },

  dueDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  payButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 9,
    marginLeft: 10,
  },

  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  paidInfo: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '800',
    marginRight: 8,
  },

  paidInfoText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },

  sectionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  sectionTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },

  historyCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  historyMonth: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  smallBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 8,
  },

  smallBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  infoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },

  infoLabel: {
    color: '#64748b',
    fontSize: 13,
    flexShrink: 0,
  },

  infoValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 10,
  },

  fullButton: {
    backgroundColor: '#2563eb',
    marginTop: 12,
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },

  fullButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },

  outlineButton: {
    width: '100%',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },

  outlineButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
  },

  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  documentIcon: {
    fontSize: 18,
    marginRight: 7,
  },

  transactionCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },

  transactionIdContainer: {
    width: '100%',
    paddingVertical: 7,
  },

  transactionId: {
    color: '#334155',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
    flexWrap: 'wrap',
  },

  transactionAmount: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '800',
  },
});