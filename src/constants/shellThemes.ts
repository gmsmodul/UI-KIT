import rasenganAvatar from '../assets/images/avatar_rasengan_teacher_1795083999917.jpg';

export interface MenuShellTint {
  id: string;
  label: string;
  toneName: string;
  light: string;
  dark: string;
}

export const MENU_SHELL_TINTS: Record<string, MenuShellTint> = {
  utilities: {
    id: 'utilities',
    label: '1. Utilities',
    toneName: 'Whisper Lavender',
    light: '#ECE7FF',
    dark: '#382F63',
  },
  datadisplay: {
    id: 'datadisplay',
    label: '2. Data Display',
    toneName: 'Whisper Sky',
    light: '#E4F0FF',
    dark: '#233A57',
  },
  dataentry: {
    id: 'dataentry',
    label: '3. Data Entry',
    toneName: 'Blush Mist',
    light: '#FCEAF1',
    dark: '#57263A',
  },
  feedback: {
    id: 'feedback',
    label: '4. Feedback',
    toneName: 'Warm Cream',
    light: '#FDF2E4',
    dark: '#543C20',
  },
  tables: {
    id: 'tables',
    label: '5. Tables',
    toneName: 'Soft Mint',
    light: '#E4F6EE',
    dark: '#1F4838',
  },
  charts: {
    id: 'charts',
    label: '6. Charts',
    toneName: 'Pale Periwinkle',
    light: '#E9ECFF',
    dark: '#2D3461',
  },
  maps: {
    id: 'maps',
    label: '7. Maps',
    toneName: 'Ice Cyan',
    light: '#E3F4F8',
    dark: '#1F444D',
  },
  navigation: {
    id: 'navigation',
    label: '8. Navigation',
    toneName: 'Pale Violet',
    light: '#F1E9FE',
    dark: '#402B5C',
  },
  behavioral: {
    id: 'behavioral',
    label: '9. Behavioral',
    toneName: 'Soft Peach',
    light: '#FDECE6',
    dark: '#542F25',
  },
  layout: {
    id: 'layout',
    label: '10. Layout',
    toneName: 'Cool Mist',
    light: '#E9EEF5',
    dark: '#2F3847',
  },
  authstate: {
    id: 'authstate',
    label: '11. Auth & State',
    toneName: 'Pale Sage',
    light: '#ECF6E6',
    dark: '#2D4725',
  },
  mobilekit: {
    id: 'mobilekit',
    label: '12. Mobile Kit',
    toneName: 'Soft Orchid',
    light: '#F7E9FB',
    dark: '#4D2754',
  },
};

export const MENU_SHELL_TINT_LIST: MenuShellTint[] = Object.values(MENU_SHELL_TINTS);

/**
 * Ultra-light radial/diagonal fade masks into pure surface white/slate
 * so the sidebar tint stays airy and non-distracting during menu switches.
 */
export const SHELL_TINT_MASK_LIGHT =
  'linear-gradient(135deg, rgba(0,0,0,0.44) 0%, rgba(0,0,0,0.14) 22%, rgba(0,0,0,0) 46%)';

export const SHELL_TINT_MASK_DARK =
  'linear-gradient(135deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.09) 22%, rgba(0,0,0,0) 46%)';

export const PROFILE_SHELL_TINT: MenuShellTint = {
  id: 'profile',
  label: 'Account Profile',
  toneName: 'Soft Slate',
  light: '#ECEEF6',
  dark: '#2D3343',
};

export interface UserProfileData {
  name: string;
  role: string;
  initials: string;
  email: string;
  department: string;
  location: string;
  timezone: string;
  bio: string;
  followers: number;
  projects: number;
  verified: boolean;
  avatarSrc: string;
}

export const USER_PROFILE: UserProfileData = {
  name: 'User',
  role: 'Role',
  initials: 'US',
  email: 'user@designsystem.app',
  department: 'Product Design',
  location: 'Jakarta, Indonesia',
  timezone: 'Asia/Jakarta (WIB)',
  bio: 'Berkomitmen merancang pengalaman digital yang mulus, konsisten, dan menarik.',
  followers: 416,
  projects: 54,
  verified: true,
  avatarSrc: rasenganAvatar,
};
