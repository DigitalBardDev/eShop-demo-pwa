export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user: { email: 'demo@demo.com' } } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null })
  },
  from: (table) => ({
    select: () => {
      const p = Promise.resolve({ data: [], error: null });
      p.order = async () => ({ data: [], error: null });
      return p;
    },
    insert: (payload) => {
      const p = Promise.resolve({ data: [{ id: Date.now(), ...payload[0] }], error: null });
      p.select = async () => ({ data: [{ id: Date.now(), ...payload[0] }], error: null });
      return p;
    },
    update: () => ({ eq: async () => ({ error: null }) }),
    delete: () => ({ eq: async () => ({ error: null }) })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/500' } })
    })
  }
};