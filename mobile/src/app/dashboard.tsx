import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>
              Welcome
            </Text>

            <Text style={styles.appName}>
              Smart Society
            </Text>

            <Text style={styles.subtitle}>
              Society Management System
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>


        {/* ================= DASHBOARD ================= */}
        <View style={styles.content}>

          <Text style={styles.dashboardTitle}>
            Dashboard
          </Text>

          <Text style={styles.dashboardSubtitle}>
            Manage your society easily from one place
          </Text>


          {/* ================= STAT CARDS ================= */}
          <View style={styles.statsContainer}>

            {/* Residents */}
            <View style={styles.statCard}>
              <View style={styles.iconCircleBlue}>
                <Text style={styles.iconText}>
                  👥
                </Text>
              </View>

              <Text style={styles.statTitle}>
                Residents
              </Text>

              <Text style={styles.statNumber}>
                120
              </Text>

              <Text style={styles.statDescription}>
                Total residents
              </Text>
            </View>


            {/* Occupied Flats */}
            <View style={styles.statCard}>
              <View style={styles.iconCircleGreen}>
                <Text style={styles.iconText}>
                  🏠
                </Text>
              </View>

              <Text style={styles.statTitle}>
                Occupied Flats
              </Text>

              <Text style={styles.statNumber}>
                95
              </Text>

              <Text style={styles.statDescription}>
                Currently occupied
              </Text>
            </View>


            {/* Society Status */}
            <View style={styles.statCard}>
              <View style={styles.iconCirclePurple}>
                <Text style={styles.iconText}>
                  🏢
                </Text>
              </View>

              <Text style={styles.statTitle}>
                Society Status
              </Text>

              <Text style={styles.activeText}>
                Active
              </Text>

              <Text style={styles.statDescription}>
                System operational
              </Text>
            </View>

          </View>


          {/* ================= QUICK ACCESS ================= */}
          <Text style={styles.sectionTitle}>
            Quick Access
          </Text>

          <Text style={styles.sectionSubtitle}>
            Access important society services
          </Text>


          <View style={styles.menuContainer}>

            {/* Maintenance */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/maintenance')}
            >
              <View style={styles.menuIconBlue}>
                <Text style={styles.menuIcon}>
                  💳
                </Text>
              </View>

              <Text style={styles.menuTitle}>
                Maintenance
              </Text>

              <Text style={styles.menuDescription}>
                View maintenance bills
              </Text>
            </TouchableOpacity>


            {/* Payments */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/maintenance')}
            >
              <View style={styles.menuIconGreen}>
                <Text style={styles.menuIcon}>
                  💰
                </Text>
              </View>

              <Text style={styles.menuTitle}>
                Payments
              </Text>

              <Text style={styles.menuDescription}>
                Manage your payments
              </Text>
            </TouchableOpacity>


            {/* Complaints */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/complaints')}
            >
              <View style={styles.menuIconOrange}>
                <Text style={styles.menuIcon}>
                  📝
                </Text>
              </View>

              <Text style={styles.menuTitle}>
                Complaints
              </Text>

              <Text style={styles.menuDescription}>
                Submit and track complaints
              </Text>
            </TouchableOpacity>


            {/* Emergency */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/emergency')}
            >
              <View style={styles.menuIconRed}>
                <Text style={styles.menuIcon}>
                  🚨
                </Text>
              </View>

              <Text style={styles.menuTitle}>
                Emergency
              </Text>

              <Text style={styles.menuDescription}>
                Emergency assistance
              </Text>
            </TouchableOpacity>

          </View>


          {/* ================= SOCIETY INFORMATION ================= */}
          <Text style={styles.sectionTitle}>
            Society Information
          </Text>

          <View style={styles.infoCard}>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Society Name
              </Text>

              <Text style={styles.infoValue}>
                Smart Society
              </Text>
            </View>


            <View style={styles.separator} />


            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Total Residents
              </Text>

              <Text style={styles.infoValue}>
                120
              </Text>
            </View>


            <View style={styles.separator} />


            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Occupied Flats
              </Text>

              <Text style={styles.infoValue}>
                95
              </Text>
            </View>


            <View style={styles.separator} />


            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Society Status
              </Text>

              <Text style={styles.statusValue}>
                Active
              </Text>
            </View>

          </View>


          {/* Footer */}
          <Text style={styles.footerText}>
            Smart Society Management System
          </Text>

          <Text style={styles.footerSubText}>
            Better Society, Better Living
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  scrollContent: {
    paddingBottom: 40,
  },


  /* ================= HEADER ================= */

  header: {
    backgroundColor: '#2563eb',
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flex: 1,
  },

  welcomeText: {
    color: '#dbeafe',
    fontSize: 14,
    marginBottom: 4,
  },

  appName: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#bfdbfe',
    fontSize: 12,
    marginTop: 5,
  },

  logoutButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 10,
  },

  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },


  /* ================= CONTENT ================= */

  content: {
    padding: 20,
  },

  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  dashboardSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 22,
  },


  /* ================= STAT CARDS ================= */

  statsContainer: {
    gap: 15,
  },

  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,

    elevation: 3,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  iconCircleBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  iconCircleGreen: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  iconCirclePurple: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  iconText: {
    fontSize: 22,
  },

  statTitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },

  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 5,
  },

  activeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 7,
  },

  statDescription: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 5,
  },


  /* ================= SECTION ================= */

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 30,
  },

  sectionSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 15,
  },


  /* ================= MENU ================= */

  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  menuCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,

    elevation: 3,

    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  menuIconBlue: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  menuIconGreen: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  menuIconOrange: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  menuIconRed: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  menuIcon: {
    fontSize: 22,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  menuDescription: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 5,
    lineHeight: 16,
  },


  /* ================= INFO CARD ================= */

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    marginTop: 15,

    elevation: 3,

    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },

  infoLabel: {
    color: '#64748b',
    fontSize: 14,
  },

  infoValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },

  statusValue: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: 'bold',
  },

  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },


  /* ================= FOOTER ================= */

  footerText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 35,
  },

  footerSubText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 5,
  },

});