import {
  IconClipboardSearch,
  IconLockPassword,
  IconPalette,
  IconPaperBag,
  IconUserCog,
} from '@tabler/icons-react'
import type { SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
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
    {
      title: 'SETTINGS',
      userAccess: [
        'superadmin',
        'admin',
        'user',
        'auditor',
        'advocate',
        'valuer',
      ],
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
