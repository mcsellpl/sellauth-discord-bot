module.exports = {
  botName: 'MCSell Support',
  botColor: 0x5865F2,
  successColor: 0x57F287,
  errorColor: 0xED4245,
  warningColor: 0xFEE75C,

  panel: {
    title: '🎫 MCSell Support',
    description:
      '> 💡 **Support**\n' +
      'Tell us what you need help with and include any details that may help us look into it.\n\n' +
      '> ⚠️ **Before opening a ticket**\n' +
      'Check whether your question has already been answered in the server.',
    imageUrl: null,
    thumbnailUrl: null,
    footerText: 'Select a category to open a ticket',
    placeholder: 'Select a category...',
  },

  channels: {
    logChannelId: 'Channel_Id',
    transcriptChannelId: 'Channel_Id',
    defaultTicketCategoryId: 'Channel_Id',
    closedCategoryId: 'Channel_Id',
    doneCategoryId: 'Channel_Id',
  },
  roles: {
    staffRoleIds: ['Role_Id'],
    adminRoleIds: ['Role_Id'],
    customerRoleId: 'Role_Id',
  },
  tickets: {
    maxOpenPerUser: 1,
    deleteOnClose: true,
    closeDelay: 5,
    transcriptMessageLimit: 200,
  },

  categories: [
    {
      id: 'general',
      label: 'General Support',
      description: 'General questions and support',
      emoji: '💬',
      channelPrefix: 'general',
      staffRoleId: 'Role_Id',
      requiredRoleIds: ['Role_Id'],
      categoryChannelId: 'Channel_Id',
      requiresOrderVerification: false,
      welcomeMessage: '👋 Hey {user}, welcome to your **General Support** ticket!\nPlease describe your issue and a staff member will assist you shortly.',
    },
    {
      id: 'customer',
      label: 'Customer Support',
      description: 'Order issues, delivery & after-sale support',
      emoji: '🛒',
      channelPrefix: 'customer',
      staffRoleId: 'Role_Id',
      requiredRoleIds: ['Role_Id'],
      categoryChannelId: 'Channel_Id',
      requiresOrderVerification: true,
      welcomeMessage: '👋 Hey {user}, welcome to your **Customer Support** ticket!\nYour order has been verified. A staff member will assist you shortly.',
    },
    {
      id: 'payment',
      label: 'Payment Support',
      description: 'Payment issues and refund requests',
      emoji: '💳',
      channelPrefix: 'payment',
      staffRoleId: 'Role_Id',
      requiredRoleIds: ['Role_Id'],
      categoryChannelId: 'Channel_Id',
      requiresOrderVerification: false,
      welcomeMessage: '👋 Hey {user}, welcome to your **Payment Support** ticket!\nPlease provide your payment details and a staff member will assist you shortly.',
    },
    {
      id: 'media',
      label: 'Media Apply',
      description: 'Media application and partnership inquiries',
      emoji: '🎥',
      channelPrefix: 'media',
      staffRoleId: 'Role_Id',
      requiredRoleIds: ['Role_Id'],
      categoryChannelId: 'Channel_Id',
      requiresOrderVerification: false,
      welcomeMessage: '👋 Hey {user}, welcome to your **Media Apply** ticket!\nPlease provide your media application details and a staff member will assist you shortly.',
    },
    {
      id: 'technical',
      label: 'Technical Support',
      description: 'Technical issues and bug reports',
      emoji: '🔧',
      channelPrefix: 'technical',
      staffRoleId: 'Role_Id',
      requiredRoleIds: ['Role_Id'],
      categoryChannelId: 'Channel_Id',
      requiresOrderVerification: false,
      welcomeMessage: '👋 Hey {user}, welcome to your **Technical Support** ticket!\nPlease describe your issue in detail and a staff member will assist you shortly.',
    },
    {
      id: 'partnership',
      label: 'Partnership',
      description: 'Partnership and collaboration requests',
      emoji: '🤝',
      channelPrefix: 'partnership',
      staffRoleId: 'Role_Id',
      requiredRoleIds: ['Role_Id'],
      categoryChannelId: 'Channel_Id',
      requiresOrderVerification: false,
      welcomeMessage: '👋 Hey {user}, welcome to your **Partnership** ticket!\nPlease tell us about yourself and your proposal.',
    },
  ],

  sellauth: {
    baseUrl: 'https://api.sellauth.com/v1',
  },

  verify: {
    title: '✅ Verify Yourself',
    description:
      '> ❓ **Why should I verify?**\n' +
      'By verifying you gain full access to our server including all channels, products and support.\n\n' +
      '> 📋 **How does it work?**\n' +
      'Simply click the **Verify** button below and you will receive your role instantly.\n\n' +
      'By clicking the button below you agree to our server rules.',
    color: 0x5865F2,
    imageUrl: null,
    thumbnailUrl: null,
    footerText: 'MCSell • Click the button below to verify.',
    buttonLabel: 'Verify',
    buttonEmoji: '✅',
    roleId: 'Role_Id',
  },

  payments: {
    title: '💳 Payment Methods',
    color: 0x5865F2,
    footerText: 'MCSell • Open a ticket to place an order',
    imageUrl: null,
    paypalEmail: process.env.PAYPAL_EMAIL || 'support@mcsell.com',

    active: [
      { emoji: '💳', name: 'Card / Debit' },
      { emoji: '<:MCSell_Ltc:1482729832058982462>', name: 'Litecoin' },
      { emoji: '<:MCSell_Btc:1482729814841364621>', name: 'Bitcoin' },
      { emoji: '<:MCSell_Btc:1482729814841364621>', name: 'Other Crypto', note: 'Open a ticket to ask' },
      { emoji: '<:MCSell_Paypal:1482729839281569852>', name: 'PayPal', note: 'Friends & Family only' },
      { emoji: '<:MCSell_Skrill:1482729811544903720>', name: 'Skrill' },
      { emoji: '<:MCSell_Revolut:1482729811544903720>', name: 'Revolut Pay' },
      { emoji: '<:MCSell_Paysafecard:1482729906050699284>', name: 'Paysafecard', note: 'Only for Germany(Open Ticket)' },
      { emoji: '<:MCSell_Giftcards:1482729906050699284>', name: 'Giftcards', note: 'Open a ticket to ask' },
      { emoji: '<:MCSell_GooglePay:1484904574140547162>', name: 'Google Pay' },
      { emoji: '<:MCSell_ApplePay:1484904528649392138>', name: 'Apple Pay' },
      { emoji: '<:MCSell_Klarna:1482729811544903720>', name: 'Klarna (Pay Now / Pay in 30Days' },
    ],
  },

  autorole: {
    enabled: true,
    roleIds: [
      'Role_Id',
    ],
  },

  welcome: {
    enabled: true,
    channelId: 'Channel_Id',
    title: '👋 Welcome to {server}!',
    description:
      'Hey {user}, welcome to **{server}**! 🎉\n\n' +
      'You are member **#{memberCount}**.\n',
    color: 0x5865F2,
    footerText: '{server} • Member #{memberCount}',
    showAvatar: true,
    imageUrl: null,
    pingUser: true,
  },

  autoClose: {
    enabled: true,
    inactivityDays: 7,
    warningDays: 3,
    checkIntervalHours: 24,
  },

  verifiedUsers: {
    enabled: true,
    skipVerification: true,
    storageFile: './data/verified_users.json',
  },

  refundTracker: {
    enabled: true,
    autoNotifyOnRefund: true,
  },
};




