import {
  IconAlertCircle,
  IconBuilding,
  IconChecklist,
  IconClipboardSearch,
  IconDashboard,
  // IconDatabaseImport,
  IconFileSearch,
  IconHierarchy3,
  IconLayoutDashboard,
  IconList,
  IconListDetails,
  IconLockPassword,
  IconMail,
  IconPalette,
  IconPaperBag,
  IconPlaylistAdd,
  IconUserCog,
  IconUserShield,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react'
import {
  FileCode2,
  LayoutDashboardIcon,
  List,
  WorkflowIcon,
} from 'lucide-react'
import { NavItem, type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    /* ───────────────── GENERAL ───────────────── */
    {
      title: 'GENERAL',
      userAccess: ['superadmin', 'admin', 'user'],
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'My Tasks',
          url: '/workflow/tasks',
          icon: IconClipboardSearch,
        },
      ],
    },

    /* ───────────────── ROLE-BASED WORK ───────────────── */
    {
      title: 'AUDIT',
      userAccess: ['auditor'],
      items: [
        {
          title: 'Assigned Audits',
          url: '/stock-audit/assigned-audits',
          icon: IconPaperBag,
        },
      ],
    },
    {
      title: 'ADVOCATE',
      userAccess: ['advocate'],
      items: [
        {
          title: 'Assigned Events',
          url: '/advocate',
          icon: IconClipboardSearch,
        },
      ],
    },
    {
      title: 'VALUER',
      userAccess: ['valuer'],
      items: [
        {
          title: 'Assigned Events',
          url: '/valuer',
          icon: IconClipboardSearch,
        },
      ],
    },

    /* ───────────────── ADMIN / MASTERS ───────────────── */
    {
      title: 'ADMINISTRATION',
      userAccess: ['admin', 'superadmin'],
      items: [
        {
          title: 'Departments',
          url: '/admin/departements',
          icon: IconBuilding,
        },
        { title: 'Branches', url: '/admin/branches', icon: IconHierarchy3 },

        {
          title: 'Roles',
          icon: IconUserCog,
          items: [
            { title: 'View', url: '/admin/roles', icon: IconListDetails },
            {
              title: 'Create',
              url: '/admin/roles/create',
              icon: IconPlaylistAdd,
            },
          ],
        },

        { title: 'Users', url: '/admin/users', icon: IconUsers },
        { title: 'Auditors', url: '/admin/auditors', icon: IconUsersGroup },
        { title: 'Advocates', url: '/admin/advocates', icon: IconUserShield },
        { title: 'Valuers', url: '/admin/valuers', icon: IconUserShield },

        {
          title: 'Workflow',
          icon: WorkflowIcon,
          items: [
            {
              title: 'Workflow Definitions',
              url: '/admin/workflow',
              icon: WorkflowIcon,
            },
            {
              title: 'Alerts Workflow',
              url: '/admin/alert-workflow',
              icon: WorkflowIcon,
            },
            {
              title: 'Process Settings',
              url: '/admin/process-settings',
              icon: IconListDetails,
            },
          ],
        },
        {
          title: 'Form Template',
          icon: FileCode2,
          items: [
            {
              title: 'Designer',
              url: '/admin/form-designer',
              icon: FileCode2,
            },
            {
              title: 'Library',
              url: '/admin/form-schema-library',
              icon: FileCode2,
            },
          ],
        },
        {
          title: 'Document Template',
          icon: FileCode2,
          items: [
            {
              title: 'Designer',
              url: '/admin/workflow-document-templates',
              icon: FileCode2,
            },
            {
              title: 'Library',
              url: '/admin/document-template-library',
              icon: FileCode2,
            },
          ],
        },

        {
          title: 'Alert Master',
          icon: IconAlertCircle,
          userAccess: ['superadmin'],
          items: [
            {
              title: 'EWS (Legacy)',
              url: '/admin/alerts/ews' as '/admin/alerts/$alertType',
              icon: IconAlertCircle,
            },
            {
              title: 'EWS Rules',
              url: '/admin/alerts-v2-rules',
              icon: IconAlertCircle,
            },
            {
              title: 'EWS Config / Thresholds',
              url: '/admin/alerts-v2-config',
              icon: IconAlertCircle,
            },
            {
              title: 'EWS Adapters',
              url: '/admin/alerts-v2-adapters',
              icon: IconAlertCircle,
            },
            {
              title: 'Question Masters',
              url: '/admin/alerts-v2-question-masters',
              icon: IconAlertCircle,
            },
          ],
        },

        {
          title: 'Dropdown Master',
          icon: IconList,
          items: [
            {
              title: 'Security Type',
              url: '/admin/security',
              icon: IconListDetails,
            },
            { title: 'Event Type', url: '/admin/event', icon: IconListDetails },
          ],
        },

        {
          title: 'SMTP Mail Conf.',
          url: '/admin/smtp-mail-conf',
          icon: IconMail,
        },

        // {
        //   title: 'Data Ingestion',
        //   url: '/admin/data-ingetion',
        //   icon: IconDatabaseImport,
        //   userAccess: ['superadmin'],
        // },
      ],
    },

    /* ───────────────── ACCOUNT SUMMARIES ───────────────── */
    {
      title: 'ACCOUNT SUMMARY',
      userAccess: ['admin', 'superadmin', 'user'],
      items: [
        {
          title: 'Standard Accounts',
          url: '/standard/summary' as NavItem['url'],
          icon: IconChecklist,
        },
        {
          title: 'SMA Accounts',
          url: '/sma/summary' as NavItem['url'],
          icon: IconChecklist,
        },
        {
          title: 'NPA Accounts',
          url: '/npa/summary' as NavItem['url'],
          icon: IconChecklist,
        },
      ],
    },
    {
      title: 'LOAN REVIEW',
      userAccess: ['admin', 'superadmin', 'user'],
      items: [
        {
          title: 'Term Loan Review',
          icon: IconClipboardSearch,
          items: [
            {
              title: 'Summary',
              url: '/term-loan-review/summary',
              icon: IconListDetails,
            },
            {
              title: 'Review',
              url: '/term-loan-review',
              icon: IconClipboardSearch,
            },
          ],
        },
      ],
    },

    /* ───────────────── AUDIT MODULE ───────────────── */
    {
      title: 'STOCK AUDIT',
      userAccess: ['admin', 'superadmin', 'user'],
      items: [
        {
          title: 'Dashboard',
          url: '/audit/dashboard',
          icon: LayoutDashboardIcon,
        },
        { title: 'Accounts', url: '/audit', icon: List },
      ],
    },

    /* ───────────────── ALERTS ───────────────── */
    {
      title: 'ALERTS',
      userAccess: ['admin', 'superadmin', 'user'],
      items: [
        {
          title: 'EWS',
          icon: IconAlertCircle,
          items: [
            {
              title: 'Dashboard',
              url: '/alerts/ews/dashboard' as '/alerts/$alertType/dashboard',
              icon: IconDashboard,
            },
            {
              title: 'Alerts',
              url: '/alerts/ews' as '/alerts/$alertType',
              icon: IconAlertCircle,
            },
          ],
        },
      ],
    },

    /* ───────────────── SEARCH ───────────────── */
    {
      title: 'SEARCH',
      userAccess: ['admin', 'superadmin', 'user'],
      items: [
        { title: 'Inspections', url: '/inspections', icon: IconFileSearch },
        { title: 'Notices', url: '/notices', icon: IconClipboardSearch },
      ],
    },

    /* ───────────────── SETTINGS ───────────────── */
    {
      title: 'SETTINGS',
      userAccess: ['superadmin', 'admin', 'user'],
      items: [
        { title: 'Profile', url: '/settings', icon: IconUserCog },
        {
          title: 'Change Password',
          url: '/settings/change-password',
          icon: IconLockPassword,
        },
        { title: 'Appearance', url: '/settings/appearance', icon: IconPalette },
      ],
    },
  ],
}
