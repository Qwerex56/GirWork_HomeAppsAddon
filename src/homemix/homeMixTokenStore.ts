import type { useHomeMix } from '@homemix/vue'
import type { TokenStore } from './tokenStore'

type HomeMix = ReturnType<typeof useHomeMix>['homemix']

const COLLECTION = 'session'
const KEY = 'gir'

/** The person's private add-on data in HomeApps (scope user): only they can read it. The password is never stored. */
export function homeMixTokenStore(homemix: HomeMix): TokenStore {
  return {
    async read() {
      const doc = await homemix.data.get<{ token: string }>(COLLECTION, KEY, 'user')
      return doc?.value.token ?? ''
    },
    async write(token) {
      const doc = await homemix.data.get(COLLECTION, KEY, 'user')
      await homemix.data.put(COLLECTION, KEY, { token }, { scope: 'user', version: doc?.version })
    },
    async clear() {
      const doc = await homemix.data.get(COLLECTION, KEY, 'user')
      if (doc) await homemix.data.delete(COLLECTION, KEY, { scope: 'user', version: doc.version })
    },
  }
}
