'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Building2,
  Users,
  ArrowRight,
  RefreshCw,
  Plus,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Crown,
} from 'lucide-react';

interface Society {
  _id: string;
  name: string;
  society_code: string;
  address: string;
  city: string;
  state: string;
  contact_number: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SocietyStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  residents: number;
  admins: number;
  managers: number;
  watchmen: number;
}

interface SocietyWithStats extends Society {
  stats?: SocietyStats;
}

export default function SocietiesPage() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [societies, setSocieties] = useState<SocietyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin =
    user?.role === 'super_admin';

  const fetchSocieties = async (
    showRefreshToast = false
  ) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get('/societies');

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            'Failed to load societies'
        );
      }

      const societyList: Society[] =
        response.data.data || [];

      const societiesWithStats =
        await Promise.all(
          societyList.map(
            async (society) => {
              try {
                const statsResponse =
                  await api.get(
                    `/societies/${society._id}/stats`
                  );

                return {
                  ...society,
                  stats:
                    statsResponse.data?.success
                      ? statsResponse.data.data
                      : undefined,
                };
              } catch {
                return {
                  ...society,
                  stats: undefined,
                };
              }
            }
          )
        );

      setSocieties(
        societiesWithStats
      );

      if (showRefreshToast) {
        toast({
          title: 'Refreshed',
          description:
            'Society list has been refreshed.',
        });
      }

    } catch (error: any) {
      console.error(
        'Failed to fetch societies:',
        error
      );

      toast({
        title: 'Societies Error',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load societies.',
        variant: 'destructive',
      });

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isSuperAdmin) {
      router.replace('/');
      return;
    }

    fetchSocieties();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    user,
    isSuperAdmin,
  ]);

  if (
    authLoading ||
    loading
  ) {
    return (
      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
        "
      >
        <div className="text-center">
          <RefreshCw
            className="
              w-10
              h-10
              text-blue-600
              animate-spin
              mx-auto
            "
          />

          <p
            className="
              mt-4
              text-slate-500
              font-medium
            "
          >
            Loading societies...
          </p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const totalSocieties =
    societies.length;

  const activeSocieties =
    societies.filter(
      (society) =>
        society.is_active
    ).length;

  const inactiveSocieties =
    societies.filter(
      (society) =>
        !society.is_active
    ).length;

  const totalUsers =
    societies.reduce(
      (total, society) =>
        total +
        (society.stats?.totalUsers || 0),
      0
    );

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                w-12
                h-12
                rounded-xl
                bg-red-600
                flex
                items-center
                justify-center
              "
            >
              <Crown
                className="
                  w-6
                  h-6
                  text-white
                "
              />
            </div>

            <div>
              <h1
                className="
                  text-2xl
                  sm:text-3xl
                  font-bold
                  text-slate-900
                "
              >
                Manage Societies
              </h1>

              <p
                className="
                  text-slate-500
                  mt-1
                "
              >
                Manage all societies from one place
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            flex
            gap-2
            flex-wrap
          "
        >
          <Button
            variant="outline"
            onClick={() =>
              fetchSocieties(true)
            }
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`
                w-4
                h-4
                ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              `}
            />

            Refresh
          </Button>

          <Button
            className="gap-2"
            onClick={() =>
              toast({
                title:
                  'Create Society',
                description:
                  'Society creation form will be added next.',
              })
            }
          >
            <Plus className="w-4 h-4" />

            Create Society
          </Button>
        </div>
      </div>


      {/* SUPER ADMIN INFO */}

      <Card
        className="
          border-0
          shadow-sm
          bg-gradient-to-r
          from-red-50
          to-orange-50
        "
      >
        <CardContent className="p-5">

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <Crown
              className="
                w-6
                h-6
                text-red-600
              "
            />

            <div>
              <p
                className="
                  font-semibold
                  text-red-800
                "
              >
                Super Admin Portal
              </p>

              <p
                className="
                  text-sm
                  text-red-600
                "
              >
                {user?.email}
              </p>
            </div>
          </div>

        </CardContent>
      </Card>


      {/* SUMMARY CARDS */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          gap-5
        "
      >

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Total Societies
            </p>

            <p
              className="
                text-3xl
                font-bold
                text-slate-900
                mt-2
              "
            >
              {totalSocieties}
            </p>
          </CardContent>
        </Card>


        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Active Societies
            </p>

            <p
              className="
                text-3xl
                font-bold
                text-green-600
                mt-2
              "
            >
              {activeSocieties}
            </p>
          </CardContent>
        </Card>


        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Inactive Societies
            </p>

            <p
              className="
                text-3xl
                font-bold
                text-red-600
                mt-2
              "
            >
              {inactiveSocieties}
            </p>
          </CardContent>
        </Card>


        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Total Users
            </p>

            <p
              className="
                text-3xl
                font-bold
                text-blue-600
                mt-2
              "
            >
              {totalUsers}
            </p>
          </CardContent>
        </Card>

      </div>


      {/* SOCIETY LIST */}

      <Card
        className="
          border-0
          shadow-sm
        "
      >

        <CardHeader>
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <CardTitle
              className="
                flex
                items-center
                gap-2
              "
            >
              <Building2
                className="
                  w-5
                  h-5
                  text-blue-600
                "
              />

              All Societies

              <Badge
                variant="outline"
                className="ml-2"
              >
                {totalSocieties}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>


        <CardContent>

          {societies.length === 0 ? (

            <div
              className="
                text-center
                py-16
              "
            >
              <Building2
                className="
                  w-14
                  h-14
                  mx-auto
                  text-slate-300
                "
              />

              <h3
                className="
                  mt-4
                  text-lg
                  font-semibold
                  text-slate-700
                "
              >
                No societies found
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                Create your first society to get started.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-3
                gap-5
              "
            >

              {societies.map(
                (society) => (

                  <Card
                    key={society._id}
                    className="
                      border
                      border-slate-200
                      hover:border-blue-300
                      hover:shadow-md
                      transition-all
                    "
                  >

                    <CardContent className="p-5">

                      {/* TOP */}

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            gap-3
                          "
                        >

                          <div
                            className="
                              w-11
                              h-11
                              rounded-xl
                              bg-blue-100
                              flex
                              items-center
                              justify-center
                              shrink-0
                            "
                          >
                            <Building2
                              className="
                                w-6
                                h-6
                                text-blue-600
                              "
                            />
                          </div>

                          <div>
                            <h3
                              className="
                                font-bold
                                text-slate-900
                              "
                            >
                              {society.name}
                            </h3>

                            <p
                              className="
                                text-xs
                                text-slate-500
                                mt-1
                              "
                            >
                              Code: {society.society_code}
                            </p>
                          </div>

                        </div>


                        <Badge
                          className={
                            society.is_active
                              ? `
                                bg-green-100
                                text-green-700
                                hover:bg-green-100
                              `
                              : `
                                bg-red-100
                                text-red-700
                                hover:bg-red-100
                              `
                          }
                        >
                          {society.is_active ? (
                            <>
                              <CheckCircle
                                className="
                                  w-3
                                  h-3
                                  mr-1
                                "
                              />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle
                                className="
                                  w-3
                                  h-3
                                  mr-1
                                "
                              />
                              Inactive
                            </>
                          )}
                        </Badge>

                      </div>


                      {/* DETAILS */}

                      <div
                        className="
                          mt-5
                          space-y-3
                        "
                      >

                        <div
                          className="
                            flex
                            items-start
                            gap-2
                            text-sm
                            text-slate-600
                          "
                        >
                          <MapPin
                            className="
                              w-4
                              h-4
                              mt-0.5
                              text-slate-400
                              shrink-0
                            "
                          />

                          <span>
                            {society.address}
                            {society.city
                              ? `, ${society.city}`
                              : ''}
                            {society.state
                              ? `, ${society.state}`
                              : ''}
                          </span>
                        </div>


                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-slate-600
                          "
                        >
                          <Phone
                            className="
                              w-4
                              h-4
                              text-slate-400
                            "
                          />

                          {society.contact_number}
                        </div>


                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-slate-600
                          "
                        >
                          <Users
                            className="
                              w-4
                              h-4
                              text-slate-400
                            "
                          />

                          <span>
                            Users:{' '}
                            <strong>
                              {society.stats?.totalUsers || 0}
                            </strong>
                          </span>
                        </div>

                      </div>


                      {/* BUTTON */}

                      <div className="mt-5">

                        <Link
                          href={`/admin/societies/${society._id}`}
                          className="block"
                        >
                          <Button
                            className="
                              w-full
                              gap-2
                            "
                          >
                            Open Society

                            <ArrowRight
                              className="
                                w-4
                                h-4
                              "
                            />
                          </Button>
                        </Link>

                      </div>

                    </CardContent>

                  </Card>

                )
              )}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  );
}