import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy URL — catalog lives at `/library`. */
export const Route = createFileRoute('/help')({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: '/library',
      hash: location.hash,
      search: location.search,
    })
  },
})
