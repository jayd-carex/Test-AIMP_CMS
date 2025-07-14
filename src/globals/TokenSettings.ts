import { GlobalConfig } from 'payload'

const TokenSettings: GlobalConfig = {
  slug: 'token-settings',
  label: 'Token Settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'monthlyTokenLimit',
      type: 'number',
      label: 'Monthly Token Limit',
      required: true,
      defaultValue: 150000,
    },
  ],
}

export default TokenSettings
