import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TourState {
  active: boolean
  stepIndex: number
  completedUserIds: string[]
  startTour: () => void
  nextStep: (maxStep: number) => void
  prevStep: () => void
  skipTour: (userId: string) => void
  completeTour: (userId: string) => void
  hasCompletedTour: (userId: string) => boolean
  restartTour: () => void
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      active: false,
      stepIndex: 0,
      completedUserIds: [],

      startTour: () => set({ active: true, stepIndex: 0 }),

      nextStep: (maxStep) => {
        const next = get().stepIndex + 1
        if (next > maxStep) return
        set({ stepIndex: next })
      },

      prevStep: () => {
        set({ stepIndex: Math.max(0, get().stepIndex - 1) })
      },

      skipTour: (userId) => {
        const ids = get().completedUserIds
        if (!ids.includes(userId)) {
          set({
            active: false,
            stepIndex: 0,
            completedUserIds: [...ids, userId],
          })
        } else {
          set({ active: false, stepIndex: 0 })
        }
      },

      completeTour: (userId) => {
        const ids = get().completedUserIds
        set({
          active: false,
          stepIndex: 0,
          completedUserIds: ids.includes(userId) ? ids : [...ids, userId],
        })
      },

      hasCompletedTour: (userId) => get().completedUserIds.includes(userId),

      restartTour: () => set({ active: true, stepIndex: 0 }),
    }),
    {
      name: 'conviction-product-tour',
      partialize: (state) => ({
        completedUserIds: state.completedUserIds,
      }),
    }
  )
)
