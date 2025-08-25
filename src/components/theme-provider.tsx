'use client'

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { cssVariables } from "@/lib/design-tokens"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={true}
      disableTransitionOnChange
      {...props}
    >
      <style jsx global>{`
        :root {
          ${Object.entries(cssVariables)
            .map(([key, value]) => `${key}: ${value};`)
            .join('\n          ')}
        }
      `}</style>
      {children}
    </NextThemesProvider>
  )
}