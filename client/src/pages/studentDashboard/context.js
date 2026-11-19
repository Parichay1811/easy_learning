import { createContext } from 'react'

// True in the admin "view as student" viewer: no play buttons or game links.
export const ReadOnlyContext = createContext(false)
