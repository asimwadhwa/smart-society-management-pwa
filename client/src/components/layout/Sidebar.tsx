'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

import {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Users,
  BarChart3,
  FileText,
  Settings,
  Home,
  Shield,
  MoreHorizontal,
  X,
  Building2,
  Crown,
} from 'lucide-react';


// ============================================================
// NAV ITEM TYPE
// ============================================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}


// ============================================================
// USER SOCIETY TYPE
// ============================================================

interface UserWithSociety {
  society_name?: string;

  society?: {
    name?: string;
    society_code?: string;
  };

  society_id?: string | null;
}


// ============================================================
// NORMAL USER NAVIGATION
// ============================================================

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/maintenance',
    label: 'Maintenance',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    href: '/complaints',
    label: 'My Complaints',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    href: '/emergency',
    label: 'Emergency',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
];


// ============================================================
// MANAGER / ADMIN NAVIGATION
// ============================================================

const adminItems: NavItem[] = [
  {
    href: '/admin/users',
    label: 'Manage Users',
    icon: <Users className="w-5 h-5" />,
    roles: ['manager', 'admin'],
  },
  {
    href: '/admin/payments',
    label: 'All Payments',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['manager', 'admin'],
  },
  {
    href: '/admin/complaints',
    label: 'All Complaints',
    icon: <FileText className="w-5 h-5" />,
    roles: ['manager', 'admin'],
  },
  {
    href: '/admin/assets',
    label: 'Assets',
    icon: <Settings className="w-5 h-5" />,
    roles: ['manager', 'admin'],
  },

  // ==========================================================
  // REPORTS - NEW
  // ==========================================================

  {
    href: '/reports',
    label: 'Reports',
    icon: <FileText className="w-5 h-5" />,
    roles: ['manager', 'admin'],
  },
];


// ============================================================
// SUPER ADMIN NAVIGATION
// ============================================================

const superAdminItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/admin/societies',
    label: 'Societies',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    href: '/admin/users',
    label: 'Manage Users',
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: '/admin/complaints',
    label: 'Complaints',
    icon: <FileText className="w-5 h-5" />,
  },

  // ==========================================================
  // REPORTS - NEW
  // ==========================================================

  {
    href: '/reports',
    label: 'Reports',
    icon: <FileText className="w-5 h-5" />,
  },
];


// ============================================================
// MOBILE NORMAL NAVIGATION
// ============================================================

const mobileNavItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
  },
  {
    href: '/maintenance',
    label: 'Bills',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    href: '/complaints',
    label: 'Complaints',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    href: '/emergency',
    label: 'SOS',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
];


// ============================================================
// MOBILE SUPER ADMIN NAVIGATION
// ============================================================

const mobileSuperAdminItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: '/admin/complaints',
    label: 'Complaints',
    icon: <FileText className="w-5 h-5" />,
  },
];


// ============================================================
// SIDEBAR COMPONENT
// ============================================================

export default function Sidebar() {

  const pathname = usePathname();

  const { user } = useAuth();

  const [
    showMobileAdminMenu,
    setShowMobileAdminMenu,
  ] = useState(false);


  // ==========================================================
  // ROLE CHECK
  // ==========================================================

  const isSuperAdmin =
    user?.role === 'super_admin';

  const isAdmin =
    user &&
    ['manager', 'admin'].includes(
      user.role
    );


  // ==========================================================
  // DYNAMIC SOCIETY NAME
  // ==========================================================

  const societyUser =
    user as UserWithSociety | null;

  const societyName =
    isSuperAdmin
      ? 'All Societies'
      : societyUser?.society_name ||
        societyUser?.society?.name ||
        'Society Management';


  // ==========================================================
  // USER INITIALS
  // ==========================================================

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';


  // ==========================================================
  // LOCATION TEXT
  // ==========================================================

  const locationText =
    isSuperAdmin
      ? 'All Societies'
      : `Flat ${user?.flat_no || 'N/A'}`;


  return (
    <>

      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="
          hidden
          lg:flex
          flex-col
          w-64
          bg-slate-900
          fixed
          left-0
          top-16
          bottom-0
          overflow-y-auto
          z-40
        "
      >

        {/* USER BADGE */}

        <div
          className="
            p-4
            border-b
            border-slate-700/50
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
              p-3
              bg-slate-800/50
              rounded-xl
            "
          >

            <div
              className={cn(
                `
                  w-10
                  h-10
                  rounded-full
                  flex
                  items-center
                  justify-center
                `,
                isSuperAdmin
                  ? `
                    bg-gradient-to-br
                    from-red-500
                    to-red-700
                  `
                  : `
                    bg-gradient-to-br
                    from-blue-400
                    to-blue-600
                  `
              )}
            >

              <span
                className="
                  text-white
                  font-semibold
                  text-sm
                "
              >
                {initials}
              </span>

            </div>


            <div
              className="
                flex-1
                min-w-0
              "
            >

              <p
                className="
                  text-white
                  font-medium
                  text-sm
                  truncate
                "
              >
                {user?.name}
              </p>

              <p
                className="
                  text-slate-400
                  text-xs
                  truncate
                "
              >
                {locationText}
              </p>

            </div>


            {isSuperAdmin ? (

              <Crown
                className="
                  w-4
                  h-4
                  text-red-400
                  flex-shrink-0
                "
              />

            ) : isAdmin ? (

              <Shield
                className="
                  w-4
                  h-4
                  text-blue-400
                  flex-shrink-0
                "
              />

            ) : null}

          </div>

        </div>


        {/* NAVIGATION */}

        <nav
          className="
            flex-1
            p-4
          "
        >

          {/* SUPER ADMIN */}

          {isSuperAdmin ? (

            <div className="space-y-1">

              <p
                className="
                  text-xs
                  font-medium
                  text-red-400
                  uppercase
                  tracking-wider
                  px-3
                  mb-3
                "
              >
                Super Admin
              </p>


              {superAdminItems.map(
                (item) => (

                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={cn(
                      `
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-lg
                        text-sm
                        font-medium
                        transition-all
                        duration-200
                      `,
                      pathname === item.href
                        ? `
                          bg-blue-600
                          text-white
                          shadow-lg
                          shadow-blue-600/20
                        `
                        : `
                          text-slate-400
                          hover:bg-slate-800
                          hover:text-white
                        `
                    )}
                  >

                    {item.icon}

                    <span>
                      {item.label}
                    </span>

                  </Link>

                )
              )}

            </div>

          ) : (

            <>

              {/* MAIN MENU */}

              <div className="space-y-1">

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                    uppercase
                    tracking-wider
                    px-3
                    mb-3
                  "
                >
                  Main Menu
                </p>


                {navItems.map(
                  (item) => (

                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        `
                          flex
                          items-center
                          gap-3
                          px-3
                          py-2.5
                          rounded-lg
                          text-sm
                          font-medium
                          transition-all
                          duration-200
                        `,
                        pathname === item.href
                          ? `
                            bg-blue-600
                            text-white
                            shadow-lg
                            shadow-blue-600/20
                          `
                          : `
                            text-slate-400
                            hover:bg-slate-800
                            hover:text-white
                          `
                      )}
                    >

                      {item.icon}

                      <span>
                        {item.label}
                      </span>

                    </Link>

                  )
                )}

              </div>


              {/* ADMINISTRATION */}

              {isAdmin && (

                <div className="mt-8">

                  <p
                    className="
                      text-xs
                      font-medium
                      text-slate-500
                      uppercase
                      tracking-wider
                      px-3
                      mb-3
                    "
                  >
                    Administration
                  </p>


                  <div className="space-y-1">

                    {adminItems
                      .filter(
                        (item) =>
                          item.roles?.includes(
                            user?.role || ''
                          )
                      )
                      .map(
                        (item) => (

                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              `
                                flex
                                items-center
                                gap-3
                                px-3
                                py-2.5
                                rounded-lg
                                text-sm
                                font-medium
                                transition-all
                                duration-200
                              `,
                              pathname === item.href
                                ? `
                                  bg-blue-600
                                  text-white
                                  shadow-lg
                                  shadow-blue-600/20
                                `
                                : `
                                  text-slate-400
                                  hover:bg-slate-800
                                  hover:text-white
                                `
                            )}
                          >

                            {item.icon}

                            <span>
                              {item.label}
                            </span>

                          </Link>

                        )
                      )}

                  </div>

                </div>

              )}

            </>

          )}

        </nav>


        {/* SIDEBAR FOOTER */}

        <div
          className="
            p-4
            border-t
            border-slate-700/50
          "
        >

          <div
            className="
              p-3
              bg-gradient-to-r
              from-blue-600/20
              to-slate-800
              rounded-xl
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <Building2
                className="
                  w-4
                  h-4
                  text-blue-400
                "
              />

              <p
                className="
                  text-slate-300
                  text-xs
                  font-medium
                  truncate
                "
              >
                {societyName}
              </p>

            </div>


            <p
              className="
                text-slate-500
                text-xs
                mt-0.5
                ml-6
              "
            >
              {isSuperAdmin
                ? 'Super Admin Portal'
                : 'Management System'}
            </p>

          </div>

        </div>

      </aside>


      {/* ======================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      <nav
        className="
          lg:hidden
          fixed
          bottom-0
          left-0
          right-0
          bg-white/80
          backdrop-blur-xl
          border-t
          border-slate-200
          z-50
        "
      >

        <div
          className="
            flex
            justify-around
            items-center
            h-16
            px-2
            max-w-md
            mx-auto
          "
        >

          {(isSuperAdmin
            ? mobileSuperAdminItems
            : mobileNavItems
          ).map(
            (item) => (

              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  `
                    flex
                    flex-col
                    items-center
                    justify-center
                    flex-1
                    py-2
                    rounded-xl
                    transition-all
                  `,
                  pathname === item.href
                    ? 'text-blue-600'
                    : `
                      text-slate-400
                      hover:text-slate-600
                    `
                )}
              >

                <div
                  className={cn(
                    `
                      p-1.5
                      rounded-lg
                      transition-all
                    `,
                    pathname === item.href &&
                      'bg-blue-50'
                  )}
                >

                  {item.icon}

                </div>


                <span
                  className="
                    text-[10px]
                    font-medium
                    mt-0.5
                  "
                >
                  {item.label}
                </span>

              </Link>

            )
          )}


          {/* MOBILE ADMIN BUTTON */}

          {!isSuperAdmin &&
            isAdmin && (

              <button
                type="button"
                onClick={() =>
                  setShowMobileAdminMenu(true)
                }
                className={cn(
                  `
                    flex
                    flex-col
                    items-center
                    justify-center
                    flex-1
                    py-2
                    rounded-xl
                    transition-all
                  `,
                  pathname.startsWith('/admin')
                    ? 'text-blue-600'
                    : `
                      text-slate-400
                      hover:text-slate-600
                    `
                )}
              >

                <div
                  className={cn(
                    `
                      p-1.5
                      rounded-lg
                      transition-all
                    `,
                    pathname.startsWith('/admin') &&
                      'bg-blue-50'
                  )}
                >

                  <MoreHorizontal
                    className="w-5 h-5"
                  />

                </div>


                <span
                  className="
                    text-[10px]
                    font-medium
                    mt-0.5
                  "
                >
                  Admin
                </span>

              </button>

            )}

        </div>

      </nav>


      {/* ======================================================
          MOBILE ADMIN MENU
      ====================================================== */}

      {!isSuperAdmin &&
        isAdmin &&
        showMobileAdminMenu && (

          <>

            <div
              className="
                lg:hidden
                fixed
                inset-0
                bg-black/50
                z-[60]
              "
              onClick={() =>
                setShowMobileAdminMenu(false)
              }
            />


            <div
              className="
                lg:hidden
                fixed
                bottom-0
                left-0
                right-0
                bg-white
                rounded-t-2xl
                z-[70]
                animate-in
                slide-in-from-bottom
                duration-300
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  px-4
                  py-3
                  border-b
                  border-slate-100
                "
              >

                <h3
                  className="
                    font-semibold
                    text-slate-900
                  "
                >
                  Admin Menu
                </h3>


                <button
                  type="button"
                  onClick={() =>
                    setShowMobileAdminMenu(false)
                  }
                  className="
                    p-2
                    rounded-full
                    hover:bg-slate-100
                    text-slate-500
                  "
                >

                  <X className="w-5 h-5" />

                </button>

              </div>


              <div
                className="
                  p-4
                  space-y-1
                  pb-8
                "
              >

                {adminItems
                  .filter(
                    (item) =>
                      item.roles?.includes(
                        user?.role || ''
                      )
                  )
                  .map(
                    (item) => (

                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() =>
                          setShowMobileAdminMenu(false)
                        }
                        className={cn(
                          `
                            flex
                            items-center
                            gap-3
                            px-4
                            py-3
                            rounded-xl
                            text-sm
                            font-medium
                            transition-all
                          `,
                          pathname === item.href
                            ? `
                              bg-blue-50
                              text-blue-700
                            `
                            : `
                              text-slate-600
                              hover:bg-slate-50
                            `
                        )}
                      >

                        {item.icon}

                        <span>
                          {item.label}
                        </span>

                      </Link>

                    )
                  )}

              </div>

            </div>

          </>

        )}

    </>
  );
}