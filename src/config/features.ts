export const isArmoireLocalApp = import.meta.env.VITE_NSARMOIRE_LOCAL_APP === 'true'

export const isArmoireWorkbenchEnabled = isArmoireLocalApp

export const isSilenceEnabled = import.meta.env.VITE_ENABLE_SILENCE === 'true'

export const areInternalRoutesEnabled = import.meta.env.VITE_ENABLE_INTERNAL_ROUTES === 'true'
